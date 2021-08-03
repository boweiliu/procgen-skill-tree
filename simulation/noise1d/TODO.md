

1. logistic or relu-clamped instead of -1/1 quantization
2. try moving avg, exponential attenuation, or sqrt attenuation for brownian
3. desampling, maxpool, upsampling
4. ordinary gaussian blur filter - how does variance affect frequency spectrum
5. half-integrate the ordinary gaussian blur filter, then take the limit to dirac delta
6. binary search-like algorithm for context free brownian
