# https://boweiliu.github.io/procgen-skill-tree

ALSO SEE:  https://github.com/johnfn/ld-starter-code

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

* http://sigmajs.org/ ?


-----
## Procedural Rendering
* Approach A
    * We have 3 tiers of octagonal frames 
    * generate 2 tiers of templates per zoom level
    * generating the base physical layout concurrently with the topological structure
    * displayed physical layout is dependent on the zoom level
* Approach B
    * We have 2 tiers of square frames
    * generate 3 tiers of templates per zoom level
    * render 1 tier and partially render the parent and children tiers
    * each template's physical layout is generated independently of the zoom level

-----

## Graph Generation Plan v0

1. Name all template layers by path from initial layer
1. name all corners in a particular layer
1. generate corner-to-corner connection graphs
1. plot the graphs w. coordinates on canvas

### Flavor assignment

1. Generate voronoi centers based on hashing node names
1. determine flavor of each center
1. write BFS double-flow algorithm to determine flavor of non-centers
1. re-weight highway connections (approxmiately 5x, some random variation)
1. based on the type of node (highway vs local vs deadend) assign actual stats
1. render a user's stats and stat formula
1. allow user to allocate points and update their stats

## Gameplay plan - high level principles

1. Player has a character who battles enemy monsters in an idle manner. Player character and monsters have HP and various other stats (to be determined - e.g. elemental resistances? weapon classes?)
1. Player character has a skill tree with nodes that give the player character combat stats. Player can (conditionally) allocate skill points on the skill tree as they acquire character skill points.
1. Player gains character skill points upon defeating sufficiently powerful monsters, and also gains pity points slowly on a regular interval. (e.g. 2/hr or something)
1. Character skill tree is not fully visible - there is a fog of war on the character skill tree
1. Monster stats and generation is governed by a monster skill tree which is also controlled by the player. The monster skill tree has the same skeletal/topological structure as the character skill tree.
1. The player can allocate nodes on the monster skill tree, which does 3 things:
* Each node increases monster stats
* Somehow allocating more nodes increases "monster level", aka drop rate that monsters give skill points 
* Allocating more nodes reveals the fog of war on the character skill tree - e.g. outside a certain graph distance from the allocated monster tree, character tree points cannot be allocated; a little further, character tree point stats are obscured but the general type of node is still visible; a little further, and even the flavor of the node is hidden and the only visible structure is the topological skeleton of connections.
1. Monster skill points drop at roughly the same rate as character skill points, but players may choose not to allocate them; if their character is strong enough, though, it's pretty advantageous to do so because finding increased "monster level" or "juice" in the tree leads to faster progression of the character skill tree.

### As a result:
* Player has to work with a skill tree budget to optimize their character skill tree pursuant to fog-of-war restrictions and tree topological structure, but otherwise has full agency over how to build their character, and can take advantage of various synergies on the character skill tree.
* As player character skill points increases, player character gains gradually in power, with certain keystone nodes resulting in significant power spikes which are noticeable in combat.
* Character power increases results in killing monsters faster/more juiced monsters which increases skill points rewards which then allows faster character power growth. This is the core game loop.
* The monster skill tree also has a skill point budget, and players are encouraged to juice up their monsters as much as their characters can handle so as to increase drop rate.
* If the monsters outscale the player at any point, the player can simply wait for more pity skill points to drop and catch up their character power accordingly.
* Game will need significant balancing around drop rate formula - how monster power compares to character power. In initial prototype playtesting we may want to increase the pity point drop rate relative to monster skill point drops if we simply want to test skill tree or stats table UX.

## Further ideas once the core game loop is finished:
- Gear drops that interact with either of the skill trees
- Monster-chracter cross-skill-tree interaction
- Player controls multiple characters that have different builds and can exchange gear in a mutually beneficial way
- Prestige and meta-prestige idle mechanics
- Meta-skill-tree mechanics, e.g. "fog of war research"

----
## MISC

https://github.com/pixijs/pixi-layers/wiki

https://gamedevbeginner.com/the-right-way-to-lerp-in-unity-with-examples/


