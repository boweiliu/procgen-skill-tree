#!/usr/bin/env python

from matplotlib import pyplot as plt
import sys
import numpy as np
import spectrum
import noise
import scipy
import scipy.signal as signal
from util import DURATION, N
from spectrum import NUM_BUCKETS
from brownian_quantization import plot_helper

def main():
    plot_helper(white_powernormalized)

def test():
    #x, y = white_bernoulli_powernormalized(100)
    x, y = white_gaussian_powernormalized(100)
    plt.plot(x[:100], y[:100, 0])
    #plt.plot(x[:], y[:, 0])
    plt.show()
    print(np.mean(np.mean(y * y, axis=0)))

def white_bernoulli_powernormalized(iterations = 1, base = 'bernoulli'):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    if base == 'bernoulli':
        ds = np.random.randint(2, size=(N, iterations)) # 0 or 1
        ds = ds * 2 - 1  # -1 or 1
    elif base == 'gaussian':
        ds = np.random.normal(0, 1, size=(N, iterations))
    return xs, ds

def white_gaussian_powernormalized(iterations = 1):
    return white_bernoulli_powernormalized(iterations, base = 'gaussian')

if __name__ == '__main__':
    if len(sys.argv) >= 2:
        test()
    else:
        main()

