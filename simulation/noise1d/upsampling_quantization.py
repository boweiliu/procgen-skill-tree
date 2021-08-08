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
from blur_filter import white_bernoulli_powernormalized, diff_window, white_bernoulli_diff
from brownian_quantization import brown_bernoulli_2waynormalized

def main():
    plot_helper(white_bernoulli_powernormalized)

    plt.legend()
    #mng = plt.get_current_fig_manager()
    #mng.frame.Maximize(True)
    figManager = plt.get_current_fig_manager()
    figManager.window.showMaximized()
    plt.show()

def test():
    #x, y = white_bernoulli_powernormalized(100)
    #x, y = brown_bernoulli_2waynormalized(100)
    #x, y = white_bernoulli_invsqrt_accumulate(100)
    x, y = white_bernoulli_invsqrt_diff(100)
    #x, y = white_bernoulli_diff(100)
    #x, y = white_bernoulli_gaussblur9(100)
    print(np.mean(np.mean(y * y, axis=0)))
    #plt.plot(x[:100], y[:100, 0])
    plt.plot(x[100:150], y[100:150, 0])
    #plt.plot(x[:], y[:, 0])
    plt.show()
    plt.clf()

    fig = plt.figure()
    def anim(i):
        plt.clf()
        plt.ylim(-2, 2)
        plt.plot(x[100 * i:100*(i+5)], y[100 * i:100*(i+5), 0])
        #plt.plot(x[50 * i:50*(i+5)], y[50 * i:50*(i+5), 0])
        #plt.show()
    animator = ani.FuncAnimation(fig, anim, interval = 100)
    plt.show()

def gaussian_white(iterations = 1):
def gaussian_pink(iterations = 1):
def gaussian_pink_warm(iterations = 1):
def gaussian_pink_warm2way(iterations = 1):
def gaussian_brown(iterations = 1):
def gaussian_brown_2way(iterations = 1):
def gaussian_azure(iterations = 1):
def gaussian_azure_warm(iterations = 1):
def gaussian_violet(iterations = 1):

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

