#!/usr/bin/env python

from matplotlib import pyplot as plt
import sys
import numpy as np
import spectrum
import noise
from util import DURATION, N
from spectrum import NUM_BUCKETS

def main():
    #plot_helper(brown_bernoulli_powernormalized)
    #plot_helper(brown_bernoulli_powernormalized_quantized)
    #plot_helper(brown_bernoulli_powernormalized_clamp)
    #plot_helper(brown_bernoulli_powernormalized_clampquarter)
    #plot_helper(brown_bernoulli_powernormalized_softmax)
    plot_helper(brown_bernoulli_2waynormalized)
    plot_helper(brown_bernoulli_2waynormalized_quantized)
    plot_helper(brown_bernoulli_2waynormalized_clamp)
    plot_helper(brown_bernoulli_2waynormalized_clampquarter)
    plot_helper(brown_bernoulli_2waynormalized_softmax)
    plot_helper(brown_bernoulli_2waynormalized_whiteditherquarter)
    plt.legend()
    #mng = plt.get_current_fig_manager()
    #mng.frame.Maximize(True)
    figManager = plt.get_current_fig_manager()
    figManager.window.showMaximized()
    plt.show()

def test():
    #x, y = brown_gaussian_powernormalized(100)
    #x, y = brown_bernoulli_powernormalized_quantized(100)
    #x, y = brown_bernoulli_powernormalized_clamp(100)
    #x, y = brown_bernoulli_powernormalized_clampquarter(100)
    #x, y = brown_bernoulli_powernormalized_softmax(100)
    #x, y = brown_bernoulli_2waynormalized(100)
    #x, y = brown_bernoulli_2waynormalized_quantized(100)
    x, y = brown_bernoulli_2waynormalized_whiteditherquarter(100)
    #x, y = brown_bernoulli_powernormalized(100)
    #plt.plot(x[:100], y[:100, 0])
    plt.plot(x[:], y[:, 0])
    plt.show()
    print(np.mean(np.mean(y * y, axis=0)))

def brown_bernoulli_powernormalized(iterations = 1, base = 'bernoulli'):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    if base == 'bernoulli':
        ds = np.random.randint(2, size=(N, iterations)) # 0 or 1
        ds = ds * 2 - 1  # -1 or 1
    elif base == 'gaussian':
        ds = np.random.normal(0, 1, size=(N, iterations))
    ys = np.cumsum(ds, axis=0)
# normalize
    lin = np.linspace(ys[0], ys[N-1], N, endpoint=True)
    ys = np.subtract(ys, lin)
    power = np.mean(ys * ys, axis=0)
    ys = np.divide(ys, np.sqrt(power))
    return xs, ys

def brown_bernoulli_2waynormalized(iterations = 1, base = 'bernoulli'):
    xs = np.linspace(0, DURATION, N, endpoint=False)
    if base == 'bernoulli':
        ds = np.random.randint(2, size=(N, iterations)) # 0 or 1
        ds = ds * 2 - 1  # -1 or 1
    elif base == 'gaussian':
        ds = np.random.normal(0, 1, size=(N, iterations))
    ys = np.cumsum(ds, axis=0)

    if base == 'bernoulli':
        ds2 = np.random.randint(2, size=(N, iterations)) # 0 or 1
        ds2 = ds2 * 2 - 1  # -1 or 1
    elif base == 'gaussian':
        ds2 = np.random.normal(0, 1, size=(N, iterations))
    ys2 = np.flip(np.cumsum(ds2, axis=0), axis=0)
    ys = ys + ys2

# normalize
    avg = np.mean(ys, axis=0)
    ys = ys - avg
    power = np.mean(ys * ys, axis=0)
    ys = np.divide(ys, np.sqrt(power))
    return xs, ys

WHITE_DITHER_MASK = np.random.normal(0, 1, size=(N,1))

def brown_bernoulli_powernormalized_quantized(iterations = 1, quantization = 'hard', normalization = 'boundary', *args, **kwargs):
    if normalization == 'boundary':
        xs, os = brown_bernoulli_powernormalized(iterations, *args, **kwargs)
    elif normalization == 'uniform':
        xs, os = brown_bernoulli_2waynormalized(iterations, *args, **kwargs)
    # hard quantize positive to 1 and negative to -1
    if quantization == 'hard':
        ys = np.where(np.greater_equal(os, 0), 1, -1)
    elif quantization == 'clamp':
        ys = np.where(np.greater_equal(os, 1), 1, np.where(np.less_equal(os, -1), -1, os))
    elif quantization == 'clampquarter':
        ys = np.where(np.greater_equal(os, .25), .25, np.where(np.less_equal(os, -.25), -.25, os)) * 4
    elif quantization == 'softmax':
        ys = (2 / (1 + np.exp(-os)) - 1) * 2.3 # ran it a few times and this seems to be the avg power
    elif quantization == 'whiteditherquarter':
        ys = np.where(np.greater_equal(os, WHITE_DITHER_MASK/4), 1, -1)
    return xs, ys

def brown_gaussian_powernormalized(iterations = 1):
    return brown_bernoulli_powernormalized(iterations, 'gaussian')

def brown_gaussian_powernormalized_quantized(iterations = 1):
    return brown_bernoulli_powernormalized_quantized(iterations, 'gaussian')

def brown_bernoulli_powernormalized_clamp(iterations = 1):
    return brown_bernoulli_powernormalized_quantized(iterations, quantization='clamp')

def brown_bernoulli_powernormalized_softmax(iterations = 1):
    return brown_bernoulli_powernormalized_quantized(iterations, quantization='softmax')

def brown_bernoulli_powernormalized_clampquarter(iterations = 1):
    return brown_bernoulli_powernormalized_quantized(iterations, quantization='clampquarter')

def brown_bernoulli_2waynormalized_quantized(iterations = 1):
    return brown_bernoulli_powernormalized_quantized(iterations, normalization='uniform')

def brown_bernoulli_2waynormalized_clamp(iterations = 1):
    return brown_bernoulli_powernormalized_quantized(iterations, normalization='uniform', quantization='clamp')

def brown_bernoulli_2waynormalized_clampquarter(iterations = 1):
    return brown_bernoulli_powernormalized_quantized(iterations, normalization='uniform', quantization='clampquarter')

def brown_bernoulli_2waynormalized_softmax(iterations = 1):
    return brown_bernoulli_powernormalized_quantized(iterations, normalization='uniform', quantization='softmax')

def brown_bernoulli_2waynormalized_whiteditherquarter(iterations = 1):
    return brown_bernoulli_powernormalized_quantized(iterations, normalization='uniform', quantization='whiteditherquarter')

def plot_helper(fn, label='log-log'):
    x, y = spectrum.generate_bucketed_spectrum(fn)
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y[2:NUM_BUCKETS//2]), label=fn.__name__ + ' ' + label)

if __name__ == '__main__':
    if len(sys.argv) >= 2:
        test()
    else:
        main()
