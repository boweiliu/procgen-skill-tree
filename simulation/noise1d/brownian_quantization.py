#!/usr/bin/env python

from matplotlib import pyplot as plt
from util import DURATION, N
import numpy as np
import spectrum
import noise
from spectrum import NUM_BUCKETS

def brown_bernoulli_powernormalized(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ds = np.random.randint(2, size=(N, iterations)) # 0 or 1
    ds = ds * 2 - 1  # -1 or 1
    ys = np.cumsum(ds, axis=0)
# normalize
    lin = np.linspace(ys[0], ys[N-1], N, endpoint=True)
    ys = np.subtract(ys, lin)
    power = np.mean(ys * ys, axis=0)
    ys = np.divide(ys, np.sqrt(power))
    return xs, ys

def brown_bernoulli_powernormalized_quantized(iterations = 1):
    xs, ys = brown_bernoulli_powernormalized(iterations)

def brown_gaussian_powernormalized(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ds = np.random.normal(0, 1, size=(N, iterations))
    ys = np.cumsum(ds, axis=0)
# normalize
    lin = np.linspace(ys[0], ys[N-1], N, endpoint=True)
    ys = np.subtract(ys, lin)
    power = np.mean(ys * ys, axis=0)
    ys = np.divide(ys, np.sqrt(power))
    return xs, ys


def test():
    x, y = brown_gaussian_powernormalized(100)
    plt.plot(x, y[:, 0])
    plt.show()
    print(np.mean(np.mean(y * y, axis=0)))


def main():
    x, y1 = spectrum.generate_bucketed_spectrum(noise.generate_brownian_normalized_noise)
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y1[2:NUM_BUCKETS//2]), label='brown bernoulli power-normalized (log-log)')
    plt.legend()
    plt.show()

if __name__ == '__main__':
    #main()
    test()
