
import numpy as np
import scipy
from scipy.fft import fft, fftfreq
from matplotlib import pyplot as plt

from util import N, SAMPLE_RATE, DURATION, nfft
from noise import generate_bernoulli_noise

NUM_BUCKETS = 300 # this should divide N
BUCKET_SIZE = int(N / NUM_BUCKETS)

if __name__ == '__main__':
    xs, ys = generate_bernoulli_noise()
    yf = nfft(ys)
    xf = fftfreq(N, 1 / SAMPLE_RATE)
    #plt.plot(xf, np.abs(yf))

    # compute squared power, and divide into buckets
    # also we should normalize so we can show percentage power
    unbucketed_power_f = np.abs(yf) * np.abs(yf) 
    bucketed_pp_f = np.array([ 1/N * np.sum(unbucketed_power_f[ i * BUCKET_SIZE : ( i+1 ) * BUCKET_SIZE]) for i in range(NUM_BUCKETS) ]) # percent power
    bucketed_xf = np.array([ 1/BUCKET_SIZE * np.sum(xf[i * BUCKET_SIZE:(i+1) * BUCKET_SIZE]) for i in range(NUM_BUCKETS) ]) # avg

    plt.plot(bucketed_xf, bucketed_pp_f)
    plt.show()

