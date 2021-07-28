
import numpy as np
import scipy
from scipy.fft import fft, fftfreq

DURATION = 9 # seconds
SAMPLE_RATE = 10000 # Hz
N = DURATION * SAMPLE_RATE
normalization  = 1 / np.sqrt(N)

def nfft(*args, **kwargs):
    return fft(*args, **kwargs) * normalization

