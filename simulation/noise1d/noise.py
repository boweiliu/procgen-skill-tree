#!/usr/bin/env python

import numpy as np
from util import N, SAMPLE_RATE, DURATION

# normalized: 1/N \sum x^2 == 1
def generate_bernoulli_noise(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ys = np.random.randint(2, size=(N, iterations)) # 0 or 1
    ys = ys * 2 - 1 # -1 or 1
    return xs, ys

def generate_gaussian_noise(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ys = np.random.normal(0, 1, size=(N, iterations))
    return xs, ys

def generate_brownian_bernoulli_noise(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ds = np.random.randint(2, size=(N, iterations)) # 0 or 1
    ds = ds * 2 - 1 # -1 or 1
    #padding = np.array([0 for _ in range(iterations)]).reshape((1, iterations))
    #ds = np.concatenate((padding, ds), axis=0)
    ys = np.cumsum(ds, axis=0)
    # normalization
    ys = ys/np.sqrt((N+1)/2)
    return xs, ys

def generate_brownian_2way_noise(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ds1 = np.random.randint(2, size=(N, iterations)) # 0 or 1
    ds1 = ds1 * 2 - 1 # -1 or 1
    #padding = np.array([0 for _ in range(iterations)]).reshape((1, iterations))
    #ds = np.concatenate((padding, ds), axis=0)
    ys1 = np.cumsum(ds1, axis=0)
    ds2 = np.random.randint(2, size=(N, iterations)) # 0 or 1
    ds2 = ds2 * 2 - 1 # -1 or 1
    #padding = np.array([0 for _ in range(iterations)]).reshape((1, iterations))
    #ds = np.concatenate((padding, ds), axis=0)
    ys2 = np.cumsum(ds2, axis=0)
    ys2 = np.flip(ys2, axis=0)
    ys = ys1 + ys2
    # normalizagion
    ys = ys/np.sqrt(N+1)
    return xs, ys

def generate_brownian_warmstart_noise(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ds = np.random.randint(2, size=(N * 2, iterations)) # 0 or 1
    ds = ds * 2 - 1 # -1 or 1
    #padding = np.array([0 for _ in range(iterations)]).reshape((1, iterations))
    #ds = np.concatenate((padding, ds), axis=0)
    ys = np.cumsum(ds, axis=0)
    ys = ys[N:2*N]
    # normalization
    ys = ys/np.sqrt((2*N + N+1)/2)
    return xs, ys

# normalize both endpoints to 0 and the power to exactly 1
def generate_brownian_normalized_noise(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ds = np.random.randint(2, size=(N * 2, iterations)) # 0 or 1
    ds = ds * 2 - 1 # -1 or 1
    #padding = np.array([0 for _ in range(iterations)]).reshape((1, iterations))
    #ds = np.concatenate((padding, ds), axis=0)
    ys = np.cumsum(ds, axis=0)
    ys = ys[N:2 * N]
# normalize
    lin = np.linspace(ys[0], ys[N-1], N, endpoint=True)
    ys = np.subtract(ys, lin)
    power = np.mean(ys * ys, axis=0)
    ys = np.divide(ys, np.sqrt(power))
    return xs, ys

# quantized to zero one
def generate_brownian_quantized_noise(iterations = 1):
    # start with gaussian and accumulate it
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ds = np.random.normal(0, 1, size=(N, iterations))
    ys = np.cumsum(ds, axis=0)
    # now quantize
    ys = np.where(np.greater_equal(ys, 0),1,-1)
    return xs, ys
    
# normalize both endpoints to 0 and the power to exactly 1. THEN quantize/clamp
def generate_brownian_normalized_clamped_noise(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ds = np.random.randint(2, size=(N * 2, iterations)) # 0 or 1
    ds = ds * 2 - 1 # -1 or 1
    #padding = np.array([0 for _ in range(iterations)]).reshape((1, iterations))
    #ds = np.concatenate((padding, ds), axis=0)
    ys = np.cumsum(ds, axis=0)
    ys = ys[N:2 * N]
# normalize
    lin = np.linspace(ys[0], ys[N-1], N, endpoint=True)
    ys = np.subtract(ys, lin)
    power = np.mean(ys * ys, axis=0)
    ys = np.divide(ys, np.sqrt(power))
    ys = np.where(np.greater_equal(ys, 0),1,-1)
    return xs, ys

# TODO: start with bb but normalize so t=0 and t=9 are both 0, and normalize power to 1 per-iteration
# TODO: like 2way but instead of starting on the 2 ends, also start in the middle, and at the quartiles, etc.?

def generate_blue_bernoulli_noise(iterations = 1):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ds = np.random.randint(2, size=(N, iterations)) # 0 or 1
    ds = ds * 2 - 1 # -1 or 1
    #padding = np.array([0 for _ in range(iterations)]).reshape((1, iterations))
    #ds = np.concatenate((padding, ds), axis=0)
    ys = np.diff(ds, axis=0, prepend=0)
    # normalization??? TODO
    #ys = ys/np.sqrt((N+1)/2)
    return xs, ys


if __name__ == '__main__':
    from matplotlib import pyplot as plt

    # x, y = generate_blue_bernoulli_noise(100)
    #x, y = generate_brownian_normalized_noise(100)
    #x, y = generate_brownian_quantized_noise(100)
    # x, y = generate_brownian_bernoulli_noise(100)
    x, y = generate_brownian_normalized_clamped_noise(100)
    #plt.plot(x[:100], y[:100,0])
    plt.plot(x,y[:,0])
    plt.show()
# verify normalization. this should be close to 1
    print(np.mean(np.mean(y * y, axis=0)))


