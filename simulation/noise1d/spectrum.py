#!/usr/bin/env python

import numpy as np
import scipy
from scipy.fft import fft, fftfreq
from matplotlib import pyplot as plt

from util import N, SAMPLE_RATE, DURATION, nfft
from noise import generate_bernoulli_noise

# number of buckets to divde the frequencies into. note that # of frequencies == N/2
NUM_BUCKETS = 300 # this should divide N/2
BUCKET_SIZE = int(N /2 / NUM_BUCKETS)

if __name__ == '__main__':
    xs, ys = generate_bernoulli_noise()
    #yf = nfft(ys[:,0], axis=0)
    yf = nfft(ys, axis=0)[:,0]
    xf = fftfreq(N, 1 / SAMPLE_RATE) # 0 .... 4999, -5000, .... -1 order
    #plt.plot(xf, np.abs(yf))

    # computed squared power
    unbucketed_power_f = np.abs(yf) * np.abs(yf) 
    # divide inot buckets and cut off the redundant negative frequencies
    
    bucketed_p_f = np.array([ np.sum(unbucketed_power_f[ i * BUCKET_SIZE : ( i+1 ) * BUCKET_SIZE]) for i in range(NUM_BUCKETS) ]) # percent power
    #bucketed_xf = np.array([ 1/BUCKET_SIZE * np.sum(xf[i * BUCKET_SIZE:(i+1) * BUCKET_SIZE]) for i in range(NUM_BUCKETS) ]) # avg
    bucketed_xf = np.mean((xf[0:N//2]).reshape(NUM_BUCKETS, BUCKET_SIZE), axis=1)
    # also we should normalize so on average each data point == 1
    bucketed_pp_f = bucketed_p_f / BUCKET_SIZE

    plt.plot(bucketed_xf, bucketed_pp_f)
    plt.show()

