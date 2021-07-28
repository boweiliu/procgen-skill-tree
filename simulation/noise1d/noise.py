
import numpy as np
from util import N, SAMPLE_RATE, DURATION

def generate_bernoulli_noise():
    xs = np.linspace(0, DURATION, N, endpoint=False)
    ys = np.random.randint(2, size=len(xs)) # 0 or 1
    ys = ys * 2 - 1 # -1 or 1
    return xs, ys

if __name__ == '__main__':
    from matplotlib import pyplot as plt
    x, y = generate_bernoulli_noise()
    plt.plot(x[:100], y[:100])
    plt.show()


