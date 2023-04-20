# Benchmarks

This directory contains benchmarks to measure performance and not blindly optimize based.

# Things to consider

- This doesn't paint the whole picture: Benchmarks only show what happens in the benchmarks not in a real world application. But we can make educated guesses based on the benchmark results. Just remember those are guesses.
- I don't know about the quality of the used testing framework. At the time of writing it seemed hard to find a proper benchmark solution for JS.
- The benchmark doesn't seem to test things like memory allocation which is more interesting to me right now than spead. We can maybe can make guesses that a faster benchmark has to run less garbage collection. But that is just a guess.
