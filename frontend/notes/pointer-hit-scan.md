## Algorithms to help find which object a pointer is moused over

The goal is to enable use of the pointer lock api which decouples mouse move from pixi, so we might have to write our own pointer intersection algorithm.

https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API

https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API


Computation geometry resources:

https://www.geeksforgeeks.org/given-a-set-of-line-segments-find-if-any-two-segments-intersect/

Not quite what we are looking for

https://cp-algorithms.com/data_structures/segment_tree.html

also not quite what we want, but related and good to know

https://stackoverflow.com/questions/28639476/finding-all-intervals-that-overlap-a-point

this is it! interval trees or range trees

https://doc.cgal.org/latest/SearchStructures/index.html 

computational geometry algs database.

https://www.cgal.org/

https://cs.stackexchange.com/questions/109356/how-to-find-the-number-of-intervals-containing-a-point-when-given-a-static-set-o

not that useful

https://en.wikipedia.org/wiki/AVL_tree

good implementation for binary tree??

https://www.geeksforgeeks.org/interval-tree/

here we are! interval tree

https://en.wikipedia.org/wiki/Interval_tree

https://en.wikipedia.org/wiki/Range_tree 

also related - useful for 2d

https://stackoverflow.com/questions/10269179/find-rectangles-that-contain-point-efficient-algorithm

https://en.wikipedia.org/wiki/R-tree

https://en.wikipedia.org/wiki/B-tree



