#!/usr/bin/env python

import numpy as np
import scipy
from scipy.fft import fft, fftfreq
from matplotlib import pyplot as plt

from util import N, SAMPLE_RATE, DURATION, nfft
import noise

# number of buckets to divde the frequencies into. note that # of frequencies == N/2
NUM_BUCKETS = 300 # this should divide N/2
NUM_ITER = 100 # of iterations

def generate_bucketed_spectrum(generator, tN = N):
    BUCKET_SIZE = int(tN /2 / NUM_BUCKETS)
    SAMPLE_RATE = tN / DURATION
    xs, ys = generator(NUM_ITER)
    yf = nfft(tN, ys, axis=0)
    xf = fftfreq(tN, 1 / SAMPLE_RATE) # 0 .... 4999, -5000, .... -1 order
    #plt.plot(xf, np.abs(yf))

    # computed squared power
    unbucketed_power_f = np.abs(yf) * np.abs(yf) 
    # divide inot buckets and cut off the redundant negative frequencies
    
    bucketed_p_f = np.sum((unbucketed_power_f[0:tN//2]).reshape(NUM_BUCKETS, BUCKET_SIZE, NUM_ITER), axis=1)
    bucketed_xf = np.mean((xf[0:tN//2]).reshape(NUM_BUCKETS, BUCKET_SIZE), axis=1)
    # also we should normalize so on average each data point == 1
    bucketed_pp_f = bucketed_p_f / BUCKET_SIZE

    # finally, average over iterations
    rerun_bucketed_pp_f = np.mean(bucketed_pp_f, axis=1)
    return bucketed_xf, rerun_bucketed_pp_f

def generate_averaged_spectrum(generator, tN = N):
    xs, ys = generator(NUM_ITER)
    yf = nfft(tN, ys, axis=0)
    xf = fftfreq(tN, 1 / SAMPLE_RATE) # 0 .... 4999, -5000, .... -1 order
    #plt.plot(xf, np.abs(yf))

    # computed squared power
    unbucketed_power_f = np.abs(yf) * np.abs(yf) 
    unbucketed_power_f = np.mean(unbucketed_power_f, axis=1)
    return xf, unbucketed_power_f

if __name__ == '__main__':
    x, y_wb = generate_bucketed_spectrum(noise.generate_bernoulli_noise)
    _, y_wg = generate_bucketed_spectrum(noise.generate_gaussian_noise)
    _, y_bb = generate_bucketed_spectrum(noise.generate_brownian_bernoulli_noise)
    _, y_bg = generate_bucketed_spectrum(noise.generate_brownian_gaussian_noise)
    _, y_bw = generate_bucketed_spectrum(noise.generate_brownian_warmstart_noise)
    _, y_b2 = generate_bucketed_spectrum(noise.generate_brownian_2way_noise)
    _, y_bn = generate_bucketed_spectrum(noise.generate_brownian_normalized_noise)
    _, y_bq = generate_bucketed_spectrum(noise.generate_brownian_quantized_noise)
    _, y_bc = generate_bucketed_spectrum(noise.generate_brownian_normalized_clamped_noise)
    _, y_lb = generate_bucketed_spectrum(noise.generate_blue_bernoulli_noise)
    #plt.plot(x, y_wb, label='bernoulli white')
    #plt.plot(x, y_wg, label='gaussian white')
    #plt.plot(x, y_bb, label='bernoulli brown')

# full spectrum
    #xf, yf_b  = generate_averaged_spectrum(noise.generate_bernoulli_noise)
    #xf, yf_g  = generate_averaged_spectrum(noise.generate_gaussian_noise)
    #xf, yf_bb = generate_averaged_spectrum(noise.generate_brownian_bernoulli_noise)
    #xf, yf_bw = generate_averaged_spectrum(noise.generate_brownian_warmstart_noise)
    #plt.plot(xf, np.log(yf_bb), label='brown (log)')
    #plt.plot(xf, np.log(yf_bw), label='brown warm start (log)')
    #plt.xlim(100,6000)

# log -log
    #plt.plot(np.log(x), np.log(y_bw), label='warm start brown (log-log)')
    #plt.plot(np.log(x), np.log(y_bb), label='bernoulli brown (log-log)')

# cut off low and high frequencies
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y_wb[2:NUM_BUCKETS//2]), label='white bernoulli (log-log)')
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y_wg[2:NUM_BUCKETS//2]), label='white gaussian (log-log)')
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y_bb[2:NUM_BUCKETS//2]), label='brown bernoulli (log-log)')
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y_bg[2:NUM_BUCKETS//2]), label='brown gaussian (log-log)')
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y_bw[2:NUM_BUCKETS//2]), label='brown warm start (log-log)')
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y_b2[2:NUM_BUCKETS//2]), label='brown 2way (log-log)')
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y_bn[2:NUM_BUCKETS//2]), label='brown normalized (log-log)')
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y_bq[2:NUM_BUCKETS//2]), label='brown quantized (log-log)')
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y_bc[2:NUM_BUCKETS//2]), label='brown normalized and quantized (log-log)')
    plt.plot(np.log(x[2:NUM_BUCKETS//2]), np.log(y_lb[2:NUM_BUCKETS//2]), label='blue bernoulli (log-log)')
    plt.legend()
    #plt.ylim((0, 10))
    plt.show()

