# Testing Guide
This documentations documents down the tests that are written in MultiToken.t.sol and MultiTokenScript.t.sol

## Dependencies Installation

### Installing openzeppelin & solmate libraries

```shell
forge install transmissions11/solmate Openzeppelin/openzeppelin-contracts
```

## Testing

### Expected Behaviour

In the context of testing frameworks like 'ds-test', functions prefixed with 'testFail' are expected to revert. if the function does not revert, the test will fail.

### Run Test

```shell
forge test
```
