#!/usr/bin/env python

from matplotlib import pyplot as plt
import matplotlib.animation as ani
import sys
import numpy as np
import spectrum
import noise
import scipy
import scipy.signal as signal
from util import DURATION, N
from spectrum import NUM_BUCKETS
#from brownian_quantization import plot_helper
from blur_filter import white_bernoulli_powernormalized

def main():
    plot_helper(white_bernoulli_powernormalized)
    plot_helper(white_bernoulli_invsqrtblur300)
    plot_helper(white_bernoulli_invsqrt_accumulate)
    #plot_helper(white_bernoulli_diff)
    #plot_helper(white_bernoulli_gaussblur9)
    plt.legend()
    #mng = plt.get_current_fig_manager()
    #mng.frame.Maximize(True)
    figManager = plt.get_current_fig_manager()
    figManager.window.showMaximized()
    plt.show()

def test():
    #x, y = white_bernoulli_powernormalized(100)
    x, y = white_bernoulli_invsqrt_accumulate(100)
    #x, y = white_bernoulli_gaussblur9(100)
    #plt.plot(x[:100], y[:100, 0])
    #plt.plot(x[:], y[:, 0])
    #plt.show()
    #print(np.mean(np.mean(y * y, axis=0)))
    #plt.clf()

    fig = plt.figure()
    def anim(i):
        plt.clf()
        plt.ylim(-0.01, 0.01)
        plt.plot(x[100 * i:100*(i+5)], y[100 * i:100*(i+5), 0])
        #plt.show()
    animator = ani.FuncAnimation(fig, anim, interval = 100)
    plt.show()

def white_bernoulli_invsqrtblur3(iterations = 1, window=3):
    xs, ys = white_bernoulli_powernormalized(iterations)
    ys = signal.fftconvolve(ys, invsqrt_window(window, 1, iterations), mode='full', axes=0)[:N]
    return xs, ys

def invsqrt_window(window = 3, sigma = 1, iterations = 1):
    y = np.array([ 1/np.sqrt(x) for x in range(1, window + 1) ])
    ysum = np.sum(y)
    ys = np.repeat(y[:, np.newaxis], iterations, axis=1) / ysum
    return ys

def white_bernoulli_invsqrtblur300(iterations = 1):
    return white_bernoulli_invsqrtblur3(iterations, window=300)

def white_bernoulli_invsqrt_accumulate(iterations = 1):
    return white_bernoulli_invsqrtblur3(iterations, window=N)

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

