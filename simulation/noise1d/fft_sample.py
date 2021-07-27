#!/usr/bin/env python

# source: https://realpython.com/python-scipy-fft/

import numpy as np
from matplotlib import pyplot as plt
import scipy
from scipy.fft import fft, fftfreq
from sine_sample import generate_sine_wave, SAMPLE_RATE, DURATION

_, nice_tone = generate_sine_wave(400, SAMPLE_RATE, DURATION)
_, noise_tone = generate_sine_wave(4000, SAMPLE_RATE, DURATION)
noise_tone = noise_tone * 0.3

mixed_tone = nice_tone + noise_tone

normalized_tone = np.int16((mixed_tone / mixed_tone.max()) * 32767)

#plt.plot(normalized_tone[:1000])
#plt.show()

# Number of samples in normalized_tone
N = SAMPLE_RATE * DURATION

yf = fft(normalized_tone)
xf = fftfreq(N, 1 / SAMPLE_RATE)

plt.plot(xf, np.abs(yf))
plt.show()

