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
#from brownian_quantization import plot_helper

def main():
    plot_helper(white_bernoulli_powernormalized)
    plot_helper(white_gaussian_powernormalized)
    #plot_helper(white_bernoulli_uniformblur3)
    #plot_helper(white_bernoulli_uniformblur2)
    plot_helper(white_bernoulli_uniformblur300)
    plot_helper(white_bernoulli_expblur3)
    plot_helper(white_bernoulli_gaussblur3)
    plot_helper(white_bernoulli_invsqrtblur3)
    plot_helper(white_bernoulli_invsqrtblur300)
    #plot_helper(white_bernoulli_gaussblur9)
    plt.legend()
    #mng = plt.get_current_fig_manager()
    #mng.frame.Maximize(True)
    figManager = plt.get_current_fig_manager()
    figManager.window.showMaximized()
    plt.show()

def test():
    #x, y = white_bernoulli_powernormalized(100)
    #x, y = white_gaussian_powernormalized(100)
    #x, y = white_bernoulli_uniformblur3(100)
    #x, y = white_bernoulli_expblur3(100)
    x, y = white_bernoulli_gaussblur9(100)
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

def white_bernoulli_uniformblur3(iterations = 1, window=3):
    xs, ys = white_bernoulli_powernormalized(iterations)
    ys = signal.fftconvolve(ys, np.ones((window, iterations)) / window, mode='same', axes=0)
    return xs, ys

def white_bernoulli_uniformblur2(iterations = 1):
    return white_bernoulli_uniformblur3(iterations, window=2)

def white_bernoulli_uniformblur300(iterations = 1):
    return white_bernoulli_uniformblur3(iterations, window=300)

def exponential_window(window = 5, ratio = 0.5, iterations = 1):
    x = np.linspace(0, window, window, endpoint=False) # 0 ... window
    y = np.exp(x * np.log(ratio)) # 1, 1/2, 1/4, 1/8, ...
    ysum = np.sum(y) # the max value
# shape into (window, iterations)
    ys = np.repeat(y[:, np.newaxis], iterations, axis=1) / ysum
    return ys

def gaussian_window(window = 3, sigma = 1, iterations = 1):
    #y = np.array([1,2,1]) # TODO(bowei): allow other windows
    y = np.array([ scipy.special.comb(window - 1, x) for x in range(0, window) ]) # TODO(bowei): allow other sigmas
    ysum = np.sum(y)
    ys = np.repeat(y[:, np.newaxis], iterations, axis=1) / ysum
    return ys

def invsqrt_window(window = 3, sigma = 1, iterations = 1):
    y = np.array([ 1/np.sqrt(x) for x in range(1, window + 1) ])
    ysum = np.sum(y)
    ys = np.repeat(y[:, np.newaxis], iterations, axis=1) / ysum
    return ys

def white_bernoulli_expblur3(iterations = 1, window=3):
    xs, ys = white_bernoulli_powernormalized(iterations)
    ys = signal.fftconvolve(ys, exponential_window(window, 0.5, iterations), mode='same', axes=0)
    return xs, ys

def white_bernoulli_gaussblur3(iterations = 1, window=3):
    xs, ys = white_bernoulli_powernormalized(iterations)
    ys = signal.fftconvolve(ys, gaussian_window(window, 1, iterations), mode='same', axes=0)
    return xs, ys

def white_bernoulli_gaussblur9(iterations = 1):
    return white_bernoulli_gaussblur3(iterations, window=9)

def white_bernoulli_invsqrtblur3(iterations = 1, window=3):
    xs, ys = white_bernoulli_powernormalized(iterations)
    ys = signal.fftconvolve(ys, invsqrt_window(window, 1, iterations), mode='same', axes=0)
    return xs, ys

def white_bernoulli_invsqrtblur300(iterations = 1):
    return white_bernoulli_invsqrtblur3(iterations, window=300)

def plot_helper(fn, label=''):
    x, y = spectrum.generate_bucketed_spectrum(fn)
    #plt.plot(x[2:NUM_BUCKETS//1], y[2:NUM_BUCKETS//1], label=fn.__name__ + ' ' + label)
    #plt.plot(x[2:NUM_BUCKETS//1], np.log(y[2:NUM_BUCKETS//1]), label=fn.__name__ + ' ' + label)
    #plt.plot(np.log(x[2:NUM_BUCKETS//1]), np.log(y[2:NUM_BUCKETS//1]), label=fn.__name__ + ' ' + label)
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y[2:NUM_BUCKETS//2]), label=fn.__name__ + ' ' + label)
    #plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(np.abs(np.log(y[2:NUM_BUCKETS//2]))), label=fn.__name__ + ' ' + label)

if __name__ == '__main__':
    if len(sys.argv) >= 2:
        test()
    else:
        main()

