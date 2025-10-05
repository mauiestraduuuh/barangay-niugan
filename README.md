This is already built with Next.js
HOW TO CLONE THE REPO:
1. Click 'Clone a repository' then search for 'barangay-niugan'
2. Choose where to save it, then click 'Clone'
3. In VS Code terminal run these:
    npm install 
    npm run dev
4. Open http://localhost:3000 in your browser
5. You should see "Barangay Niugan Management System" in blue text.

If you successfully reached no.5 then your set up is successful:
- Repo cloned correctly
- Dependencies installed
- Dev server running

BRANCHING ROLES:
+ main - stable code (dont code directly here)
+ dev - development branch (merge must happen here first)
+ /features - individual branches for tasks
    before starting work:
    - make sure you are on DEV
    - create a feature branch (ex: feature/module name-your role & name)
    - when finished push and make a pull request

PR TEMPLATE:
1. short description 
    - what did you do?
    - why does it matter?

2. what type of change
    - bug fix
    - new feature
    - improvement
    - readme update

3. relation
    if this PR is connected to an issue, pls mention
    ex. 'This closes *issue*'

4. checklist
    [] you followd our coding style
    [] you reviewed your code
    [] you ran it locally and there are no issues
    [] all dependent modules are up to date


IMPORTANT NOTE: don't change anything in prisma folder. if you need new table in db, inform DB LEAD.