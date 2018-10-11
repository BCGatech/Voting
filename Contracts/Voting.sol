pragma solidity ^0.4.24;

import './SafeMath.sol';
import './BuzzToken.sol';

contract Voting {
    using SafeMath for uint;

    BuzzToken tokenContract;

    enum ProposalStatus {DEFAULT, OPEN, PASSED, FAILED}
    struct Proposal {
        ProposalStatus status;
        string text;
        uint expiry;
        uint votesFor;
        uint votesAgainst;
    }

    // Proposal Data Structure is a 1-1 key value store.
    // Proposals are never deleted, just set to Failed.
    uint numProposals;
    mapping(uint => Proposal) proposals;

    event Submit(address by, uint id, string text);
    event Passed(uint id);
    event Failed(uint id);

    constructor(address tokenAddress) public {
        tokenContract = BuzzToken(tokenAddress);
    }

    function submit(string _text, uint _expiry) public returns (uint id) {
        require(_expiry >= block.number);
        require(tokenContract.balanceOf(msg.sender) > 0);
        proposals[numProposals].status = ProposalStatus.OPEN;
        proposals[numProposals].text = _text;
        proposals[numProposals].expiry = _expiry;
        emit Submit(msg.sender, numProposals, _text);
        numProposals++;
        return numProposals - 1;
    }

    function vote(uint id, bool inFavor) public returns (bool success) {
        uint supply = tokenContract.totalSupply();

        // Can't vote if not Open
        require(proposals[id].status == ProposalStatus.OPEN);

        // If after expiry, don't vote, but flip status from Open
        if (proposals[id].expiry < block.number) {
            if ((proposals[id].votesFor * 2) > supply) {
                proposals[id].status = ProposalStatus.PASSED;
                emit Passed(id);
                return false;
            } else {
                proposals[id].status = ProposalStatus.FAILED;
                emit Failed(id);
                return false;
            }
        }


        if (inFavor) {
            proposals[id].votesFor
                = proposals[id].votesFor.add(tokenContract.balanceOf(msg.sender));
            if ((proposals[id].votesFor * 2) > supply) {
                proposals[id].status = ProposalStatus.PASSED;
                emit Passed(id);
            }
        } else {
            proposals[id].votesAgainst
                = proposals[id].votesAgainst.add(tokenContract.balanceOf(msg.sender));
            if ((proposals[id].votesAgainst * 2) >= supply) {
                proposals[id].status = ProposalStatus.FAILED;
                emit Failed(id);
            }
        }
        return true;
    }

    function getProposal(uint id) public view returns (
        uint,
        string,
        uint,
        uint,
        uint
    ) {
        return (
            uint(proposals[id].status),
            proposals[id].text,
            proposals[id].expiry,
            proposals[id].votesFor,
            proposals[id].votesAgainst
        );
    }
}