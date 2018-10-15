let buzztokenAddress = '0x5d4dba9e47209a1a9ad2e0a7f8337c19aa8f0397';
let votingAddress = '0xe2749E7bc8ed81BE5a8eAbb619cF8271e00d84AC';

window.addEventListener('load', function() {

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    // console.log(typeof web3);
    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider

        /*
        NOTE: As of this writing, MetaMask still injects the `Web3()` constructor.
        This means we can only control the version of web3 API used if we overwrite this constructor,
        but all the CDN versions of web3.js do not.

        I am serving a modified version of the 0.20.7 web3.js, since it's the only one I could
        find unminified and thus edit to force overwriting Web3.

        See:
        https://ethereum.stackexchange.com/questions/48729/bundling-web3js-does-not-seem-to-work-metamask-app

        TODO: Upgrade to web3 API 1.0.0 when an unminified source becomes available
         */

        web3js = new Web3(web3.currentProvider);

        // Check that we're on testnet
        if (web3js.version.network !== '4') {
            alert('Please switch your ethereum provider to the Rinkeby Test Network!');
        }
    } else {
        console.log('No web3? You should consider trying MetaMask!');
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        alert('No Web3 Detected!\n' +
            'You should consider using MetaMask!');
        web3js = new Web3();
    }

    // Now you can start your app & access web3 freely:
    startApp();
});

/* $(document).ready(() => {
    console.log('Ready!');
}); */

let buzztokenInstance, votingInstance;

let proposals = [];
const proposalStatus = [{
    icon: '',
    description: 'Default'
},
{
    icon: '🔓',
    description: 'Open'
},
{
    icon: '💚',
    description: 'Passed'
},
{
    icon: '❌',
    description: 'Failed'
}];

let startApp = () => {
    // Fill in control box data
    $('#buzztokenaddress').val(buzztokenAddress);
    $('#votingaddress').val(votingAddress);

    const version = web3js.version.api;
    $('#web3status').text(`${version} ${web3js? '👍': '👎'}`);
    $('#walletaddress').text(`${web3js.eth.accounts[0]}`);

    // Get contract instances we can interact with
    let buzztokenContract = web3js.eth.contract(buzztokenABI);
    buzztokenInstance = buzztokenContract.at(buzztokenAddress);
    let votingContract = web3js.eth.contract(votingABI);
    votingInstance = votingContract.at(votingAddress);

    buzztokenInstance.balanceOf.call(web3js.eth.accounts[0], (err, result) => {
        $('#walletbalance').text(`${parseFloat(result)} BUZZ`);
    });

    // Get the list of proposals once on start
    updateProposals();/*(err, result, index, resolve) => {
        let proposal = {
            id: index,
            status: parseFloat(result[0]),
            text: result[1],
            expiry: parseFloat(result[2]),
            votesFor: parseFloat(result[3]),
            votesAgainst: parseFloat(result[4])
        };
        proposals[index] = proposal;
        resolve();
    });*/

    // Hook up action buttons
    $('#subButton').click(submit);
    $('#voteButton').click(vote);

    // Watch for contract events
    let votingChange = web3js.eth.filter({
        address: votingAddress,
        toBlock: 'latest'
    });

    votingChange.watch((err, result) => {
       updateProposals() ;
       console.log(result);
    });
};

let updateProposals = (callback) => {
    // Done with recursive promises since each depends on the previous
    (function loop(i) {
        new Promise((resolve, reject) => {
            votingInstance.getProposal.call(i, (err, result) => {
                if(parseFloat(result[0]) === 0) {
                    reject();
                } else {
                    let proposal = {
                        id: i,
                        status: parseFloat(result[0]),
                        text: result[1],
                        expiry: parseFloat(result[2]),
                        votesFor: parseFloat(result[3]),
                        votesAgainst: parseFloat(result[4])
                    };
                    proposals[i] = proposal;
                    resolve();
                    //callback(null, result, i, resolve);
                }
            });
        }).then(loop.bind(null, i+1)).catch((err) => {
            //Done
            updateProposalsView();
        });
    })(0);
};

let updateProposalsView = () => {
  $('#proposallist').html('');
  $('#voteSelection').html('');
  for (let i = 0; i < proposals.length; i++) {
      // Proposal List
      let row = `<tr><th>${proposals[i].id}</th>`
          + `<td title="${proposalStatus[proposals[i].status].description}">`
          + `${proposalStatus[proposals[i].status].icon}</td>`
          + `<td>${proposals[i].text}</td>`
          + `<td>${proposals[i].votesFor}</td>`
          + `<td>${proposals[i].votesAgainst}</td></tr>`;
      $('#proposallist').prepend(row);

      // Vote Selector
      if (proposals[i].status === 1) {
          let option = `<option>${proposals[i].id}</option>`;
          $('#voteSelection').append(option);
      }
  }
};

let submit = () => {
    const subText = $('#subText').val().toString();
    const subExpiry = Number($('#subExpiry').val());
    votingInstance.submit.sendTransaction(subText, subExpiry,
        {
            from: web3js.eth.accounts[0],
            //gas: 3000000
        }, (err, result) => {
        console.log('Submit');
    });
};

let vote = () => {
    const voteSelection = Number($('#voteSelection').val());
    const voteFor = Number(($('#voteFor').is(':checked')));
    votingInstance.vote.sendTransaction(voteSelection, voteFor,
        {
            from: web3js.eth.accounts[0],
            //gas: 3000000
        }, (err, result) => {
        console.log('Submit');
    });
};