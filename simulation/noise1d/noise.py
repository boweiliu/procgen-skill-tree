#!/usr/bin/env python

import numpy as np
from util import N, SAMPLE_RATE, DURATION

# normalized: 1/N \sum x^2 == 1
def generate_bernoulli_noise(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ys = np.random.randint(2, size=(len(xs), iterations)) # 0 or 1
    ys = ys * 2 - 1 # -1 or 1
    return xs, ys

def generate_gaussian_noise(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ys = np.random.normal(0, 1, size=(len(xs), iterations))
    return xs, ys

def generate_brownian_bernoulli_noise(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ds = np.random.randint(2, size=(len(xs), iterations)) # 0 or 1
    ds = ds * 2 - 1 # -1 or 1
    #padding = np.array([0 for _ in range(iterations)]).reshape((1, iterations))
    #ds = np.concatenate((padding, ds), axis=0)
    ys = np.cumsum(ds, axis=0)
    # normalization
    ys = ys/np.sqrt((N+1)/2)
    return xs, ys


if __name__ == '__main__':
    from matplotlib import pyplot as plt
    x, y = generate_brownian_bernoulli_noise()
    #plt.plot(x[:100], y[:100,0])
    plt.plot(x,y[:,0])
    plt.show()


