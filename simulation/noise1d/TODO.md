

1. logistic or relu-clamped instead of -1/1 quantization 
  - DONE, hard quantization changes the spectrum, and so does a gaussian window or a white dither. the moderate quantizations don't change the spectrum at all.
  - TODO come back and try the entropy based quantization, so a value of 0.333 would result in a regular 1001001001 sequence
2. try moving avg, exponential attenuation, or sqrt attenuation for brownian. also find the distinction between gaussian filter, binomial filter, and sinc filter
3. desampling, maxpool, upsampling
4. ordinary gaussian blur filter - how does variance affect frequency spectrum
5. half-integrate the ordinary gaussian blur filter, then take the limit to dirac delta
  - make sure the thingy is sharper than the heaviside step function (1 discontinuity) but not as sharp as the dirac delta (2 discontinuity and 1 undefined). should be halfway in between in the lipschitz sense
6. binary search-like algorithm for context free brownian
  - this doesnt really work due to lack of a uniform distribution on the reals. but we can work on tying down the 2 ends of the brownian and then how do we compute the insides.