
## UI design ideas

Fundamentally players will need to manage a large amount of information and they have limited screen space. We propose 2 main modes of visually managing this information: on-tree and off-tree. We expect that eventually a combination of both modes will be the most convenient for the player.

### On-tree

What we mean by on-tree is, we use features like color, size, shape of the nodes, textures or partial colorings, symbols on or near the nodes, or hover-over or pinnable tooltips to convey information to the player; and these UI features should map to game state features (what type of node is it, what is the allocation cost, etc.) in a manner that is controlled by the player.

Design inspiration is the Civ or Stellaris "color by X" functionality: see e.g.

https://i.pinimg.com/originals/81/73/26/8173268146ad3678be0429a35c2ecc21.jpg

https://forums.civfanatics.com/attachments/20161027231346_1-jpg.456734/

https://i.ytimg.com/vi/FKruwDXp-ow/maxresdefault.jpg

https://www.google.com/search?q=stellaris%20hud&tbm=isch&hl=en&tbs=rimg:CYXKPWys4N9LYWanO-GQhTnq&client=ubuntu&hs=mgS&sa=X&ved=0CAIQrnZqFwoTCLC6vK7Ux-4CFQAAAAAdAAAAABAH&biw=1838&bih=953#imgrc=0xled9nFMy1mhM

https://i.ytimg.com/vi/mHXbZmaOGik/maxresdefault.jpg

### Off-tree

What we mean by off-tree is that we use windows or tabs on the periphery of the screen to display information about nodes or game state. For instance, the user could open node detailed info by clicking on a node, then "pin" that node's information in order to keep that information available after clicking on other nodes.

Design inspiration is eve online window UI: see

https://i.imgur.com/EM12xXZ.png

https://www.reddit.com/r/Eve/comments/210igp/how_does_everyone_lay_out_their_ui_in_eve_ill/

https://www.reddit.com/r/Eve/comments/1k6zuv/share_you_gui_layouts/



## Implementation

First, we have to consider the possibility of mixing react and pixi components. In particular, when we build the feature of attaching dead-end tassels or upgrade trees to nodes, we will need a way to view those graphs inside react component windows for each node.

There are 2 approaches: multiple pixi.Applications, each with their own `<canvas>` div element (HtmlCanvasElement), renderer, and WebGLContext; or a single pixi application that is aware of the positions of the react components and is able to render over/through/underneath them.

### Multiple pixi applications

References:

1. https://www.html5gamedevs.com/topic/37097-multiple-webgl-pixirenderer-instances-on-the-same-screen/
This dev post links to a good three.js example as well as a link to the Pixi.js Application.ts source code
https://threejs.org/examples/webgl_multiple_elements.html
https://github.com/pixijs/pixi.js/blob/dev/packages/app/src/Application.ts


2. https://github.com/pixijs/pixi.js/blob/dev/packages/core/src/AbstractRenderer.ts
Pixi js abstract renderer is responsible for actually creating the `document.createElement('canvas')`. also see 
https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement

3. https://www.html5gamedevs.com/topic/37359-when-do-i-need-to-call-rendererrenderstage/
Forum discussion on the speed of pixi renderers - explains what goes on in the Application.ts source code.

4. https://github.com/pixijs/pixi.js/issues/334
Not answering our question - this guy is just confused about stages vs containers, and trying to switch game screens using stages.

5. https://www.html5gamedevs.com/topic/39500-multiple-canvas-renderers/
Forum post about multi-canvas performance - seems like too many webgl contexts is bad, but 1-2 canvases might be useful.

6. https://github.com/pixijs/pixi.js/issues/5216
Mostly discussing performance - some references to base64 hacks to share resources between renderers. also see
https://github.com/pixijs/pixi.js/blob/dev/packages/canvas/canvas-renderer/src/CanvasRenderer.ts

7. https://stackoverflow.com/questions/21603350/is-there-any-reason-for-using-webgl-instead-of-2d-canvas-for-2d-games-apps
The difference between webgl and canvas for context.

8. https://www.html5gamedevs.com/topic/46211-multiple-pixiapplication-elements-on-a-webpage/
Apparently it's ok to repeatedly create + destroy. links to https://github.com/pixijs/pixi.js/wiki/v5-Custom-Application-GameLoop which is very informative (the base Pixi.Application is very much syntactic sugar for setting up renderer + base container)

9. https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
mozilla - what is a webgl context. some example code without pixi.

10. https://stackoverflow.com/questions/59140439/allowing-more-webgl-contexts
How to get around "too many webgl contexts" which can come up in some browsers. Some really good workarounds but strongly recommends only 1 context

11. https://stackoverflow.com/questions/30541121/multiple-webgl-models-on-the-same-page
Really suggesting to use 1 master canvas, or 1 offscreen canvas

How to get around "too many webgl contexts" which can come up in some browsers. Some really good workarounds but strongly recommends only 1 context

11. https://stackoverflow.com/questions/30541121/multiple-webgl-models-on-the-same-page
Really suggesting to use 1 master canvas, or 1 offscreen canvas

12. https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html
Sample code and explanation for dealing with the multicanvas problem.
