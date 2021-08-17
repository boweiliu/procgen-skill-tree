

1. logistic or relu-clamped instead of -1/1 quantization 
  - DONE, hard quantization changes the spectrum, and so does a gaussian window or a white dither. the moderate quantizations don't change the spectrum at all.
  - TODO come back and try the entropy based quantization, so a value of 0.333 would result in a regular 1001001001 sequence
2. try moving avg, exponential attenuation, or sqrt attenuation for brownian. also find the distinction between gaussian filter, binomial filter, and sinc filter
3. desampling, maxpool, upsampling
4. ordinary gaussian blur filter - how does variance affect frequency spectrum
5. half-integrate the ordinary gaussian blur filter, then take the limit to dirac delta
  - make sure the thingy is sharper than the heaviside step function (1 discontinuity) but not as sharp as the dirac delta (2 discontinuity and 1 undefined). should be halfway in between in the lipschitz sense
  - one-sided vs two-sided? also explore two-sided analogue of heaviside step function which is log|t|
6. binary search-like algorithm for context free brownian
  - this doesnt really work due to lack of a uniform distribution on the reals. but we can work on tying down the 2 ends of the brownian and then how do we compute the insides.
7. apply gaussian smoothing, and then resample at a higher sample rate <- this should allow us to quantize/dither better. otherwise e.g. brownian quantization sucks
  - note that it's obviously impossible to preserve the spectrum at higher frequencies if you upsample like that. decide on a freq cutoff to match
8. binary scale the inv sqrt accumulation (i.e. 1, 2, 2, 4, 4, 4, 4, 8x8, etc.) so it's actually computable

9. check histogram of noise pre- and post quantization (i.e. make sure normal CDF bin breakpoints are helping, and same for softmax)

10. assuming that each individual value of pink noise is roughly normal(0,1) distributed, what is the best way to quantize to 2 values? ans: it's the average of the normal distribution conditioned on it being positive. then what's the best way to quantize to 5 values? it's a double optimization over the values and the distributions minimizing MSE. furthermore we want to ensure the 5 values are equally distributed so that we can represent them with a 5-wide resolution increase. 
11. we can dither the above, but we should make that, say, if the normal distribution emits a value of .35 over a large region, the dithered result should match that on average.
