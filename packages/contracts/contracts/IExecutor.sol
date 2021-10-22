// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IExecutor {
  function execute() external returns (bool success);
}