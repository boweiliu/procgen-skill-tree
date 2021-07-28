#!/usr/bin/env python

# source: https://realpython.com/python-scipy-fft/

import numpy as np
from matplotlib import pyplot as plt
import scipy
from scipy.fft import fft, fftfreq
from sine_sample import generate_sine_wave, SAMPLE_RATE, DURATION

# xs run from 0 to DURATION
# nice_tone is max amplitude 1
xs, nice_tone = generate_sine_wave(400, SAMPLE_RATE, DURATION) # 400 Hz
_, noise_tone = generate_sine_wave(4000, SAMPLE_RATE, DURATION)
noise_tone = noise_tone * 0.3

#mixed_tone = nice_tone + noise_tone
mixed_tone = nice_tone

#normalized_tone = np.int16((mixed_tone / mixed_tone.max()) * 32767)
normalized_tone = mixed_tone

#plt.plot(xs[:1000], normalized_tone[:1000])
#plt.plot(normalized_tone)
#plt.show()

# Number of samples in normalized_tone
N = SAMPLE_RATE * DURATION

yf = fft(normalized_tone) / np.sqrt(N) # 1/sqrt(n) is normalization factor to preserve L2 power norm in frequency vs signal; ifft then needs * sqrt(N)
# runs from -SAMPLE_RATE/2 to SAMPLE_RATE/2, in increments of 1/DURATION
xf = fftfreq(N, 1 / SAMPLE_RATE)

plt.plot(xf, np.abs(yf))
#plt.plot(xf, np.imag(yf))
#plt.plot(xf, np.real(yf))
plt.show()

