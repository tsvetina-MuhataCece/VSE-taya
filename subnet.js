document.getElementById('subnetForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const inputStr = document.getElementById('ipv4Input').value.trim();

    const results = calculateSubnet(inputStr);

    displayResults(results);
});

function calculateSubnet(inputStr) {
    function decToBin(dec) {
        return dec.toString(2).padStart(8, '0');
    }

    function ipToBin(ip) {
        return ip.split('.').map(dec => decToBin(parseInt(dec))).join('');
    }

    function calculateSubnetMask(slash) {
        return ('1'.repeat(slash) + '0'.repeat(32 - slash)).match(/.{8}/g).map(bin => parseInt(bin, 2));
    }

    const parts = inputStr.split('/');
    const ipParts = parts[0].split('.');
    const n1 = parseInt(ipParts[0]);
    const n2 = parseInt(ipParts[1]);
    const n3 = parseInt(ipParts[2]);
    const n4 = parseInt(ipParts[3]);
    const slash = parseInt(parts[1]);

    const hostBits = 32 - slash;
    const numHosts = Math.pow(2, hostBits) - 2;

    const subnetMask = calculateSubnetMask(slash);

    const ipBin = ipToBin(parts[0]);
    const initialAddress = ipBin.slice(0, slash) + '0'.repeat(hostBits);

    const decimalParts = initialAddress.match(/.{8}/g).map(bin => parseInt(bin, 2));

    return {
        hostBits: hostBits,
        numHosts: numHosts,
        subnetMask: subnetMask.join('.'),
        initialAddress: decimalParts.join('.')
    };
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <p>Host bits: ${results.hostBits}</p>
        <p>Number of hosts: ${results.numHosts}</p>
        <p>Subnet mask: ${results.subnetMask}</p>
        <p>Initial network address: ${results.initialAddress}</p>
    `;
}
