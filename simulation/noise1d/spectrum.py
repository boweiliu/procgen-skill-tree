#!/usr/bin/env python

import numpy as np
import scipy
from scipy.fft import fft, fftfreq
from matplotlib import pyplot as plt

from util import N, SAMPLE_RATE, DURATION, nfft
import noise

# number of buckets to divde the frequencies into. note that # of frequencies == N/2
NUM_BUCKETS = 300 # this should divide N/2
BUCKET_SIZE = int(N /2 / NUM_BUCKETS)

NUM_ITER = 20

def generate_averaged_spectrum(generator):
    xs, ys = generator(NUM_ITER)
    #yf = nfft(ys[:,0], axis=0)
    yf = nfft(ys, axis=0)
    xf = fftfreq(N, 1 / SAMPLE_RATE) # 0 .... 4999, -5000, .... -1 order
    #plt.plot(xf, np.abs(yf))

    # computed squared power
    unbucketed_power_f = np.abs(yf) * np.abs(yf) 
    # divide inot buckets and cut off the redundant negative frequencies
    
    bucketed_p_f = np.sum((unbucketed_power_f[0:N//2]).reshape(NUM_BUCKETS, BUCKET_SIZE, NUM_ITER), axis=1)
    bucketed_xf = np.mean((xf[0:N//2]).reshape(NUM_BUCKETS, BUCKET_SIZE), axis=1)
    # also we should normalize so on average each data point == 1
    bucketed_pp_f = bucketed_p_f / BUCKET_SIZE

    # finally, average over iterations
    rerun_bucketed_pp_f = np.mean(bucketed_pp_f, axis=1)
    return bucketed_xf, rerun_bucketed_pp_f

if __name__ == '__main__':
    x, y_b = generate_averaged_spectrum(noise.generate_bernoulli_noise)
    _, y_g = generate_averaged_spectrum(noise.generate_gaussian_noise)
    _, y_bb = generate_averaged_spectrum(noise.generate_brownian_bernoulli_noise)
    plt.plot(x, y_b, label='bernoulli white')
    plt.plot(x, y_g, label='gaussian white')
    plt.plot(x, y_bb, label='bernoulli brown')
    plt.legend()
    plt.ylim((0, 10))
    plt.show()

