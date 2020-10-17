# procgen-skill-tree

How we set this up:

* Creat-react-app --typescript
* https://github.com/dmayala/CrossTodo/blob/d924d34ca5d542a5f0c5dc6bc9371f781e266f48/.eslintrc.json
* yarn add --dev prettier

Requirements:

* node 12 (rec: 12.19.0)
* npm 6 (rec: 6.14.8)

Ubuntu setup

* Obtain vscode - https://code.visualstudio.com/download
* `https://code.visualstudio.com/docs/setup/linux#_visual-studio-code-is-unable-to-watch-for-file-changes-in-this-large-workspace-error-enospc`
* install prettier vscode extension, ctrl-shift-I to autoformat

Deployment setup:

* Build on github pages: https://medium.com/mobile-web-dev/how-to-build-and-deploy-a-react-app-to-github-pages-in-less-than-5-minutes-d6c4ffd30f14
https://docs.github.com/en/free-pro-team@latest/github/working-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
https://create-react-app.dev/docs/deployment/
* Github actions: https://dev.to/dyarleniber/setting-up-a-ci-cd-workflow-on-github-actions-for-a-react-app-with-github-pages-and-codecov-4hnp
* view site: https://boweiliu.github.io/procgen-skill-tree

* http://sigmajs.org/ ?


-----

Graph Generation Plan v0

1. Name all template layers by path from initial layer
2. name all corners in a particular layer
3. generate corner-to-corner connection graphs
4. plot the graphs w. coordinates on canvase

Flavor assignment

1. Generate voronoi centers based on hashing node names
2. determine flavor of each center
3. write BFS double-flow algorithm to determin flavor of non-centers
4. re-weight highway connections 
5. based on the type of node, assign actual stats
6. render a user's stats and stat formula
7. allow user to allocate points and update their stats


