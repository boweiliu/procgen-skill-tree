#!/usr/bin/env python

# source: https://realpython.com/python-scipy-fft/

# linux sigh
#import matplotlib
#matplotlib.use('TkAgg')
#X Error of failed request:  BadLength (poly request too large or internal Xlib length error)

import numpy as np
from matplotlib import pyplot as plt

#SAMPLE_RATE = 44100  # Hertz
#DURATION = 4  # Seconds

SAMPLE_RATE = 10000  # Hertz
DURATION = 9  # Seconds

def generate_sine_wave(freq, sample_rate, duration):
    x = np.linspace(0, duration, sample_rate * duration, endpoint=False)
    frequencies = x * freq
    # 2pi because np.sin takes radians
    y = np.sin((2 * np.pi) * frequencies)
    return x, y

# Generate a 2 hertz sine wave that lasts for 5 seconds
if __name__ == '__main__':
    x, y = generate_sine_wave(2, SAMPLE_RATE, DURATION)
    plt.plot(x, y)
    plt.show()

