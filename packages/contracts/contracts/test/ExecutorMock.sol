// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IExecutor.sol";

contract ExecutorMock is IExecutor {
  constructor() public {}

  function execute() external override returns (bool success) {}
}

