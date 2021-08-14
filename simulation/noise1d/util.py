
import numpy as np
import scipy
from scipy.fft import fft, fftfreq

DURATION = 9 # seconds
SAMPLE_RATE = 2500 # Hz
N = DURATION * SAMPLE_RATE
normalization  = 1 / np.sqrt(N)

UP_RATIO = 5
UP_SAMPLE_RATE = SAMPLE_RATE * UP_RATIO
UP_N = DURATION * UP_SAMPLE_RATE
up_normalization = 1 / np.sqrt(UP_N)

def nfft(tN = N, *args, **kwargs):
    normalization  = 1 / np.sqrt(tN)
    return fft(*args, **kwargs) * normalization

