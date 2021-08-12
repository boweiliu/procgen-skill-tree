#!/usr/bin/env python

from matplotlib import pyplot as plt
import matplotlib.animation as ani
import sys
import numpy as np
import spectrum
import noise
import scipy
import scipy.signal as signal
from util import DURATION, N, UP_RATIO, UP_N, SAMPLE_RATE
from spectrum import NUM_BUCKETS
from invsqrt import invsqrt_window

def main():
    #plot_helper(gaussian_white)
    #plot_helper(gaussian_brown_scaled)
    ##plot_helper(gaussian_brown)
    #plot_helper(gaussian_violet)
    #plot_helper(gaussian_pink)
    #plot_helper(gaussian_pink_warm)
    #plot_helper(gaussian_azure)

    plot_helper(gaussian_white_upflat, tN = UP_N)

    plt.legend()
    #mng = plt.get_current_fig_manager()
    #mng.frame.Maximize(True)
    figManager = plt.get_current_fig_manager()
    figManager.window.showMaximized()
    plt.show()

def test():
    #x, y = gaussian_white(100)
    x, y = gaussian_white_upflat(100)
    #x, y = gaussian_brown(100)
    #x, y = gaussian_violet(100)
    #x, y = gaussian_pink(100)
    #x, y = gaussian_pink_warm(100)
    #x, y = gaussian_azure(100)
    print(np.mean(np.mean(y * y, axis=0)))
    variances = np.mean(y * y, axis=1)
    plt.plot(x[:100], y[:100, 0])
    #plt.plot(x[100:150], y[100:150, 0])
    #plt.plot(x[:], y[:, 0])
    plt.show()
    plt.clf()

    plt.plot(x[:100], variances[:100])
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

# upflat == upsampled by repetition
def gaussian_white_upflat(iterations = 1, base = 'gaussian'):
    length = UP_N
    xs = np.linspace(0, DURATION, length, endpoint=False)
    _, ys = gaussian_white(iterations, base) # shape = (N, iterations)
    mys = ys.repeat(UP_RATIO, axis=0)
    return xs, mys

def gaussian_white(iterations = 1, base = 'gaussian', length=N):
    xs = np.linspace(0, DURATION, length, endpoint=False)
    if base == 'bernoulli':
        ys = np.random.randint(2, size=(length, iterations)) # 0 or 1
        ys = ys * 2 - 1  # -1 or 1
    elif base == 'gaussian':
        ys = np.random.normal(0, 1, size=(length, iterations))
    return xs, ys

def gaussian_pink(iterations = 1):
    xs, ys = gaussian_white(iterations)
    ys = signal.fftconvolve(ys, invsqrt_window(window=N, sigma=1, iterations=iterations), mode='full', axes=0)[:N]
    ys = normalize(ys)
    return xs, ys

def gaussian_pink_warm(iterations = 1):
    length=2*N
    xs, ys = gaussian_white(iterations, length=length)
    ys = signal.fftconvolve(ys, invsqrt_window(window=N, sigma=1, iterations=iterations), mode='full', axes=0)[:length]
    ys = ys[-N:]
    ys = normalize(ys)
    return xs, ys

def gaussian_pink_warm2way(iterations = 1):
    pass

def gaussian_brown(iterations = 1):
    xs, ds = gaussian_white(iterations)
    ys = np.cumsum(ds, axis=0)
    ys = normalize(ys)
    return xs, ys

def gaussian_brown_scaled(iterations = 1):
    xs, ds = gaussian_white(iterations)
    ys = np.cumsum(ds, axis=0)
    ys = normalize(ys)
    ys = ys * 10
    return xs, ys

def gaussian_brown_2way(iterations = 1):
    pass

def gaussian_azure(iterations = 1):
    xs, ys = gaussian_pink(iterations)
    ys = np.diff(ys, axis=0, prepend=0)
    ys = normalize(ys)
    return xs, ys

def gaussian_azure_warm(iterations = 1):
    pass

def gaussian_violet(iterations = 1):
    xs, ds = gaussian_white(iterations)
    ys = np.diff(ds, axis=0, prepend=0)
    ys = normalize(ys)
    return xs, ys

def normalize(data):
    yavg = np.mean(data, axis=0)
    ys = data - yavg
    ypow = np.mean(ys * ys, axis=0)
    ys = ys / np.sqrt(ypow)
    return ys

def plot_helper(fn, label='log-log', tN = N):
    x, y = spectrum.generate_bucketed_spectrum(fn, tN = tN)
    y = y[np.abs(x) < SAMPLE_RATE//2] # if we are upsampling, only take pre-upsampled freqs
    x = x[np.abs(x) < SAMPLE_RATE//2]
    plt.plot(x, y, label=fn.__name__ + ' ' + label)
    #plt.plot(x[2:NUM_BUCKETS//1], y[2:NUM_BUCKETS//1], label=fn.__name__ + ' ' + label)
    #plt.plot(x[2:NUM_BUCKETS//1], np.log(y[2:NUM_BUCKETS//1]), label=fn.__name__ + ' ' + label)
    #plt.plot(np.log(x[:]), np.log(y[:]), label=fn.__name__ + ' ' + label)
    #plt.plot(np.log(x[2:NUM_BUCKETS//1]), np.log(y[2:NUM_BUCKETS//1]), label=fn.__name__ + ' ' + label)
    #plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y[2:NUM_BUCKETS//2]), label=fn.__name__ + ' ' + label)
    #plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(np.abs(np.log(y[2:NUM_BUCKETS//2]))), label=fn.__name__ + ' ' + label)

if __name__ == '__main__':
    if len(sys.argv) >= 2:
        test()
    else:
        main()

