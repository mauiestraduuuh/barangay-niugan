export interface CertificateResidentData {
  first_name: string;
  last_name: string;
  birthdate: Date;
  gender: string | null;
  address: string | null;
  contact_no: string | null;
  is_pwd: boolean;
  is_4ps_member: boolean;
  is_indigenous: boolean;
  household_number: string | null;
}

export interface CertificateRequestData {
  request_id: number;
  purpose: string | null;
  approved_at: Date | null;
  claim_code: string | null;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDate(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return d.toLocaleDateString("en-PH", opts);
}

export function getCertificateHTML(
  certificateType: string,
  resident: CertificateResidentData,
  request: CertificateRequestData,
  approvedByName: string,
  barangayName = "BARANGAY NIUGAN",
  barangayAddress = "Barangay Hall, Niugan, Biñan City, Laguna",
  captainName = "HON. BARANGAY CAPTAIN"
): string {
  const fullName = (resident.first_name + " " + resident.last_name).toUpperCase();
  const today = new Date();

  const longDate: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
  const monthYear: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };

  const issuedDate = formatDate(today, longDate);
  const issuedFull = ordinal(today.getDate()) + " day of " + formatDate(today, monthYear);
  const approvedDate = request.approved_at
    ? formatDate(new Date(request.approved_at), longDate)
    : issuedDate;

  const birthDate = new Date(resident.birthdate);
  const age = Math.floor(
    (today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  const birthDateFormatted = formatDate(birthDate, longDate);

  const purpose = request.purpose || "General Purpose";
  const gender = resident.gender || "—";
  const address = resident.address || barangayAddress;

  // ── Certificate body — NOTE: business clearance MUST be checked before
  //    plain "clearance" since "business clearance" contains the word "clearance"
  let certTitle = certificateType.toUpperCase();
  let certBody = "";
  const n = certificateType.toLowerCase();

  if (n.includes("residency") || n.includes("residence")) {
    certTitle = "CERTIFICATE OF RESIDENCY";
    certBody =
      "This is to certify that <strong>" + fullName + "</strong>, <strong>" + age + "</strong> years old, " +
      "<strong>" + gender + "</strong>, born on <strong>" + birthDateFormatted + "</strong>, is a bonafide " +
      "resident of <strong>" + address + "</strong> and has been residing thereat for a considerable period of time.";

  } else if (n.includes("indigency")) {
    certTitle = "CERTIFICATE OF INDIGENCY";
    certBody =
      "This is to certify that <strong>" + fullName + "</strong>, <strong>" + age + "</strong> years old, " +
      "<strong>" + gender + "</strong>, a resident of <strong>" + address + "</strong>, belongs to an indigent " +
      "family and is in need of financial and/or medical assistance.";

  } else if (n.includes("good moral")) {
    certTitle = "CERTIFICATE OF GOOD MORAL CHARACTER";
    certBody =
      "This is to certify that <strong>" + fullName + "</strong>, <strong>" + age + "</strong> years old, " +
      "<strong>" + gender + "</strong>, a resident of <strong>" + address + "</strong>, is known to be a person " +
      "of good moral character and has never been involved in any criminal or undesirable activity within " +
      "the jurisdiction of this barangay.";

  } else if (n.includes("business")) {
    // ⚠️ Must come BEFORE the plain "clearance" check
    certTitle = "BARANGAY BUSINESS CLEARANCE";
    certBody =
      "This is to certify that <strong>" + fullName + "</strong>, a resident of <strong>" + address + "</strong>, " +
      "has been granted clearance to operate a business establishment within the jurisdiction of this barangay, " +
      "subject to existing laws, ordinances, rules and regulations.";

  } else if (n.includes("clearance")) {
    // Plain barangay clearance — personal, not business
    certTitle = "BARANGAY CLEARANCE";
    certBody =
      "This is to certify that <strong>" + fullName + "</strong>, <strong>" + age + "</strong> years old, " +
      "<strong>" + gender + "</strong>, born on <strong>" + birthDateFormatted + "</strong>, is a bonafide " +
      "resident of <strong>" + address + "</strong> and is a person of good moral character with no derogatory " +
      "record on file in this office as of this date.";

  } else if (n.includes("solo parent")) {
    certTitle = "CERTIFICATE FOR SOLO PARENT";
    certBody =
      "This is to certify that <strong>" + fullName + "</strong>, <strong>" + age + "</strong> years old, " +
      "a resident of <strong>" + address + "</strong>, is recognized as a Solo Parent pursuant to " +
      "Republic Act No. 8972, otherwise known as the <em>Solo Parents' Welfare Act of 2000</em>.";

  } else if (n.includes("cohabitation") || n.includes("live-in")) {
    certTitle = "CERTIFICATE OF COHABITATION";
    certBody =
      "This is to certify that <strong>" + fullName + "</strong>, <strong>" + age + "</strong> years old, " +
      "a resident of <strong>" + address + "</strong>, is currently living as a common-law partner/spouse " +
      "within the territorial jurisdiction of this barangay.";

  } else {
    certBody =
      "This is to certify that <strong>" + fullName + "</strong>, <strong>" + age + "</strong> years old, " +
      "<strong>" + gender + "</strong>, a resident of <strong>" + address + "</strong>, is known to this office " +
      "and this certification is issued upon the request of the concerned party.";
  }

  // ── Info rows ──
  const rows: Array<{ label: string; value: string }> = [
    { label: "Date of Birth", value: birthDateFormatted },
    { label: "Age", value: age + " years old" },
    { label: "Gender", value: gender },
    { label: "Contact No.", value: resident.contact_no || "—" },
    { label: "Address", value: address },
  ];
  if (resident.household_number) rows.push({ label: "Household No.", value: resident.household_number });
  if (request.claim_code) rows.push({ label: "Claim Code", value: request.claim_code });
  if (resident.is_pwd) rows.push({ label: "PWD", value: "Yes" });
  if (resident.is_4ps_member) rows.push({ label: "4Ps Member", value: "Yes" });
  if (resident.is_indigenous) rows.push({ label: "IP/Indigenous", value: "Yes" });

  const infoHTML = rows
    .map(
      (r) =>
        '<div class="ii"><span class="il">' + r.label + "</span>" +
        '<span class="iv">' + r.value + "</span></div>"
    )
    .join("");

  const provinceCity = barangayAddress.includes(",")
    ? barangayAddress.split(",").slice(1).join(",").trim()
    : "Province / City / Municipality";

  const year = today.getFullYear();
  const cornerSVG =
    '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M2 2L14 2L14 4L4 4L4 14L2 14Z" fill="#7a1a1a"/>' +
    '<path d="M2 2L8 2L8 3L3 3L3 8L2 8Z" fill="#7a1a1a" opacity=".4"/>' +
    '<circle cx="14" cy="14" r="2" fill="#7a1a1a" opacity=".6"/>' +
    "</svg>";

  return (
    "<!DOCTYPE html>\n" +
    '<html lang="en">\n' +
    "<head>\n" +
    '<meta charset="UTF-8" />\n' +
    "<title>" + certTitle + "</title>\n" +
    "<style>\n" +
    "@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap');\n" +
    "* { margin:0; padding:0; box-sizing:border-box; }\n" +
    "html,body { width:816px; background:#fff; }\n" +
    "body { font-family:'EB Garamond','Times New Roman',serif; color:#1a1a1a; position:relative; }\n" +
    ".page { width:816px; min-height:1056px; background:#fffef9; padding:52px 64px 48px; position:relative; overflow:hidden; }\n" +
    ".page::before { content:''; position:absolute; inset:0; background-image:radial-gradient(ellipse at 20% 20%,rgba(180,140,80,.06) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(160,120,60,.05) 0%,transparent 60%); pointer-events:none; z-index:0; }\n" +
    ".b1 { position:absolute; top:12px; left:12px; right:12px; bottom:12px; border:3px solid #7a1a1a; pointer-events:none; z-index:1; }\n" +
    ".b2 { position:absolute; top:18px; left:18px; right:18px; bottom:18px; border:.5px solid #7a1a1a; pointer-events:none; z-index:1; }\n" +
    ".b3 { position:absolute; top:22px; left:22px; right:22px; bottom:22px; border:1px solid rgba(122,26,26,.3); pointer-events:none; z-index:1; }\n" +
    ".corner { position:absolute; width:32px; height:32px; z-index:2; }\n" +
    ".corner svg { width:32px; height:32px; }\n" +
    ".c-tl{top:8px;left:8px;} .c-tr{top:8px;right:8px;transform:scaleX(-1);} .c-bl{bottom:8px;left:8px;transform:scaleY(-1);} .c-br{bottom:8px;right:8px;transform:scale(-1,-1);}\n" +
    ".wm { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-30deg); font-family:'Cinzel',serif; font-size:72px; font-weight:700; color:rgba(122,26,26,.04); white-space:nowrap; pointer-events:none; z-index:0; letter-spacing:8px; }\n" +
    ".cnt { position:relative; z-index:2; }\n" +
    ".hdr { display:grid; grid-template-columns:88px 1fr 88px; align-items:center; gap:16px; padding-bottom:18px; }\n" +
    ".sw { display:flex; justify-content:center; align-items:center; }\n" +
    ".seal { width:80px; height:80px; border-radius:50%; border:2.5px solid #7a1a1a; background:radial-gradient(circle at 40% 35%,#fff8ee,#f5ede0); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:2px; position:relative; box-shadow:inset 0 0 12px rgba(122,26,26,.1),0 2px 8px rgba(0,0,0,.08); }\n" +
    ".seal::before { content:''; position:absolute; inset:4px; border-radius:50%; border:1px dashed rgba(122,26,26,.4); }\n" +
    ".seal-txt { font-family:'Cinzel',serif; font-size:8px; font-weight:600; color:#7a1a1a; letter-spacing:.5px; text-align:center; line-height:1.3; z-index:1; }\n" +
    ".seal-ico { font-size:22px; line-height:1; z-index:1; }\n" +
    ".hc { text-align:center; }\n" +
    ".rl { font-family:'Cormorant Garamond',serif; font-size:11px; font-weight:500; letter-spacing:2.5px; text-transform:uppercase; color:#555; margin-bottom:2px; }\n" +
    ".pl { font-family:'Cormorant Garamond',serif; font-size:11px; letter-spacing:1.5px; color:#666; margin-bottom:6px; }\n" +
    ".bn { font-family:'Cinzel',serif; font-size:26px; font-weight:700; color:#7a1a1a; letter-spacing:3px; line-height:1; margin-bottom:4px; }\n" +
    ".ba { font-family:'Cormorant Garamond',serif; font-size:11px; color:#666; letter-spacing:.5px; margin-bottom:6px; }\n" +
    ".ob { display:inline-block; background:#7a1a1a; color:#fff; font-family:'Cinzel',serif; font-size:8.5px; font-weight:600; letter-spacing:2px; padding:3px 14px; border-radius:2px; text-transform:uppercase; }\n" +
    ".div { display:flex; align-items:center; gap:12px; margin:18px 0; }\n" +
    ".dl { flex:1; height:1px; background:linear-gradient(to right,transparent,#7a1a1a,transparent); }\n" +
    ".dd { width:8px; height:8px; background:#7a1a1a; transform:rotate(45deg); flex-shrink:0; }\n" +
    ".do { font-size:14px; color:#7a1a1a; line-height:1; }\n" +
    ".cts { text-align:center; margin:4px 0 20px; }\n" +
    ".csub { font-family:'Cormorant Garamond',serif; font-size:12px; letter-spacing:4px; text-transform:uppercase; color:#888; margin-bottom:6px; }\n" +
    ".ct { font-family:'Cinzel',serif; font-size:24px; font-weight:700; color:#7a1a1a; letter-spacing:4px; text-transform:uppercase; position:relative; display:inline-block; padding:0 20px 10px; }\n" +
    ".ct::after { content:''; position:absolute; bottom:0; left:10%; width:80%; height:2px; background:linear-gradient(to right,transparent,#7a1a1a,transparent); }\n" +
    ".cdr { font-family:'EB Garamond',serif; font-size:11px; color:#999; margin-top:6px; letter-spacing:1px; }\n" +
    ".cg { font-family:'Cormorant Garamond',serif; font-size:13px; font-weight:600; letter-spacing:3px; text-transform:uppercase; color:#555; margin:0 8px 16px; text-align:center; }\n" +
    ".cb { font-size:15.5px; line-height:2; text-align:justify; margin:0 8px 20px; color:#1a1a1a; }\n" +
    ".it { margin:0 8px 20px; border:1px solid #d4b896; border-radius:3px; overflow:hidden; background:linear-gradient(135deg,#fffbf4,#fff8ee); }\n" +
    ".ith { background:#7a1a1a; color:#fff; font-family:'Cinzel',serif; font-size:9px; font-weight:600; letter-spacing:3px; text-transform:uppercase; text-align:center; padding:5px 12px; }\n" +
    ".ig { display:grid; grid-template-columns:1fr 1fr; padding:12px 16px; gap:7px 20px; }\n" +
    ".ii { display:flex; gap:8px; align-items:baseline; }\n" +
    ".il { font-family:'Cormorant Garamond',serif; font-weight:700; font-size:11px; letter-spacing:.5px; text-transform:uppercase; color:#7a1a1a; min-width:95px; flex-shrink:0; }\n" +
    ".iv { color:#222; font-size:13px; border-bottom:.5px dotted #ccc; flex:1; padding-bottom:1px; }\n" +
    ".pb { margin:0 8px 16px; font-size:14.5px; line-height:1.9; text-align:justify; color:#222; }\n" +
    ".ib { margin:0 8px 24px; font-size:14.5px; line-height:1.9; color:#222; }\n" +
    ".sr { display:flex; justify-content:space-between; align-items:flex-end; margin:8px 8px 0; gap:20px; }\n" +
    ".sl { font-size:11px; color:#666; line-height:2; font-family:'Cormorant Garamond',serif; }\n" +
    ".sl span { display:inline-block; font-weight:600; color:#333; letter-spacing:.3px; }\n" +
    ".sc { text-align:center; flex:1; max-width:260px; }\n" +
    ".ss { height:44px; position:relative; }\n" +
    ".ss::after { content:'(Signature over Printed Name)'; position:absolute; bottom:-2px; left:50%; transform:translateX(-50%); font-family:'Cormorant Garamond',serif; font-size:9px; color:#bbb; white-space:nowrap; font-style:italic; }\n" +
    ".sn { border-top:2px solid #1a1a1a; padding-top:5px; font-family:'Cinzel',serif; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#1a1a1a; }\n" +
    ".st { font-family:'Cormorant Garamond',serif; font-size:11px; color:#555; letter-spacing:.5px; margin-top:2px; font-style:italic; }\n" +
    ".sright { text-align:center; }\n" +
    ".sb { width:76px; height:76px; border-radius:50%; border:1.5px dashed #bbb; display:flex; align-items:center; justify-content:center; background:rgba(122,26,26,.02); }\n" +
    ".sbt { font-family:'Cormorant Garamond',serif; font-size:8px; color:#bbb; text-align:center; line-height:1.4; font-style:italic; padding:6px; }\n" +
    ".foot { margin-top:24px; text-align:center; }\n" +
    ".nv { font-family:'Cormorant Garamond',serif; font-size:9.5px; color:#aaa; letter-spacing:2px; text-transform:uppercase; font-style:italic; }\n" +
    ".fd { height:.5px; background:linear-gradient(to right,transparent,rgba(122,26,26,.3),transparent); margin:8px 0 6px; }\n" +
    ".orb { position:absolute; top:36px; right:40px; border:.5px solid #ccc; padding:5px 10px; font-size:10px; font-family:'Cormorant Garamond',serif; color:#999; background:rgba(255,255,255,.7); z-index:3; }\n" +
    ".orl { font-size:8px; letter-spacing:1.5px; text-transform:uppercase; color:#bbb; display:block; margin-bottom:2px; }\n" +
    ".orn { border-bottom:.5px solid #ccc; min-width:80px; display:block; margin-top:12px; font-size:8px; letter-spacing:1px; color:#bbb; text-align:center; padding-bottom:1px; }\n" +
    "</style>\n" +
    "</head>\n" +
    "<body>\n" +
    '<div class="page">\n' +
    '  <div class="b1"></div><div class="b2"></div><div class="b3"></div>\n' +
    '  <div class="corner c-tl">' + cornerSVG + "</div>\n" +
    '  <div class="corner c-tr">' + cornerSVG + "</div>\n" +
    '  <div class="corner c-bl">' + cornerSVG + "</div>\n" +
    '  <div class="corner c-br">' + cornerSVG + "</div>\n" +
    '  <div class="wm">' + barangayName + "</div>\n" +
    '  <div class="orb"><span class="orl">O.R. Number</span><span class="orn">_______________</span></div>\n' +
    '  <div class="cnt">\n' +
    '    <div class="hdr">\n' +
    '      <div class="sw"><div class="seal"><div class="seal-ico">\uD83C\uDFDB\uFE0F</div><div class="seal-txt">BRGY<br/>SEAL</div></div></div>\n' +
    '      <div class="hc">\n' +
    '        <p class="rl">Republic of the Philippines</p>\n' +
    '        <p class="pl">' + provinceCity + "</p>\n" +
    '        <p class="bn">' + barangayName + "</p>\n" +
    '        <p class="ba">' + barangayAddress + "</p>\n" +
    '        <span class="ob">Office of the Barangay Captain</span>\n' +
    "      </div>\n" +
    '      <div class="sw"><div class="seal"><div class="seal-ico">\u2696\uFE0F</div><div class="seal-txt">LOCAL<br/>GOVT</div></div></div>\n' +
    "    </div>\n" +
    '    <div class="div"><div class="dl"></div><div class="dd"></div><div class="do">\u2726</div><div class="dd"></div><div class="dl"></div></div>\n' +
    '    <div class="cts">\n' +
    '      <p class="csub">This Certifies That</p>\n' +
    '      <div class="ct">' + certTitle + "</div>\n" +
    '      <p class="cdr">Doc. No.: BR-' + request.request_id + "-" + year + " &nbsp;|&nbsp; Series of " + year + "</p>\n" +
    "    </div>\n" +
    '    <p class="cg">\u2014 To Whom It May Concern \u2014</p>\n' +
    '    <div class="cb">' + certBody + "</div>\n" +
    '    <div class="it"><div class="ith">Personal Information</div><div class="ig">' + infoHTML + "</div></div>\n" +
    '    <div class="pb">This certification is issued upon the request of <strong>' + fullName + "</strong> for the purpose of <strong>" + purpose + "</strong> and for whatever legal purpose it may serve best.</div>\n" +
    '    <div class="ib">Issued this <strong>' + issuedFull + "</strong> at the Office of the Barangay Captain, " + barangayName + ", Philippines.</div>\n" +
    '    <div class="sr">\n' +
    '      <div class="sl">\n' +
    "        <div>Request ID: &nbsp;<span>#" + request.request_id + "</span></div>\n" +
    "        <div>Approved: &nbsp;<span>" + approvedDate + "</span></div>\n" +
    "        <div>Processed by: &nbsp;<span>" + approvedByName + "</span></div>\n" +
    "        <div>Valid until: &nbsp;<span>One (1) year from issue</span></div>\n" +
    "      </div>\n" +
    '      <div class="sc"><div class="ss"></div><div class="sn">' + captainName + '</div><div class="st">Barangay Captain, ' + barangayName + "</div></div>\n" +
    '      <div class="sright"><div class="sb"><div class="sbt">Official<br/>Barangay<br/>Seal Here</div></div></div>\n' +
    "    </div>\n" +
    '    <div class="foot"><div class="fd"></div><div class="nv">Not Valid Without the Official Dry Seal of the Barangay</div></div>\n' +
    "  </div>\n" +
    "</div>\n" +
    "</body>\n" +
    "</html>"
  );
}