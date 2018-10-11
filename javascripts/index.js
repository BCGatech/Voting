let buzztokenAddress = '0x5d4dba9e47209a1a9ad2e0a7f8337c19aa8f0397';
let votingAddress = '0xbaec468fdac3e57ddc5b210d05f7690a095209bf';

window.addEventListener('load', function() {

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    // console.log(typeof web3);
    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
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
    $('#buzztokenaddress').val(buzztokenAddress);
    $('#votingaddress').val(votingAddress);

    const version = web3js.version.api;
    $('#web3status').text(`${version} ${web3js? '👍': '👎'}`);
    $('#walletaddress').text(`${web3js.eth.accounts[0]}`);

    let buzztokenContract = web3js.eth.contract(buzztokenABI);
    let buzztokenInstance = buzztokenContract.at(buzztokenAddress);
    votingContract = web3js.eth.contract(votingABI);
    votingInstance = votingContract.at(votingAddress);

    buzztokenInstance.balanceOf.call(web3.eth.accounts[0], (err, result) => {
        $('#walletbalance').text(`${parseFloat(result)} BUZZ`);
    });

    updateProposals((err, result, index, resolve) => {
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
    });

    $('#subButton').click(submit);
    $('#voteButton').click(vote);
};

let updateProposals = (callback) => {
    // Done with recursive promises since each depends on the previous
    (function loop(i) {
        if (i < 10) new Promise((resolve, reject) => {
            votingInstance.getProposal.call(i, (err, result) => {
                if(parseFloat(result[0]) === 0) {
                    reject();
                } else {
                    callback(null, result, i, resolve);
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
  $('#proposallist').html('');
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
            from: web3.eth.accounts[0],
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
            from: web3.eth.accounts[0],
            //gas: 3000000
        }, (err, result) => {
        console.log('Submit');
    });
};