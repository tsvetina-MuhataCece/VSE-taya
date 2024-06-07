document.addEventListener("DOMContentLoaded", function () {
    let deviceCounts = { Router: 0, Server: 0, Printer: 0, PC: -1, Laptop: 0, Phone: 0, Tablet: 0 };
    let nextHostAddress = '';

document.addEventListener('click', function (event) {
    if (event.target.classList.contains('moveUp')) {
        const row = event.target.closest('tr');
        if (row.previousElementSibling && !row.previousElementSibling.querySelector('th')) {
            row.parentNode.insertBefore(row, row.previousElementSibling);
            updateButtons(row.closest('table'));
        } 
    }
});

document.addEventListener('click', function (event) {
        if (event.target.classList.contains('removeRow')) {
            const table = event.target.closest('table');
            const rows = table.querySelectorAll('tr:not(:first-child)');
        if (rows.length <= 4) {
            alert("Cannot delete the last two rows.");
        } else {
            const row = event.target.closest('tr');
            row.remove();
            updateButtons(table);
        }
    }
});
    

    function initializeForm(form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const ipv4Input = form.querySelector('.ipv4Input').value.trim();
            const hostsInput = parseInt(form.querySelector('.hostsInput').value.trim(), 10);

            if (hostsInput < 2) {
                alert("Number of hosts should be at least 2.");
                return;
            }

            const ipParts = ipv4Input.split('/');
            if (ipParts.length !== 2) {
                alert("Invalid IPv4 address format. Use the format x.x.x.x/x!");
                return;
            }

            const ipAddress = ipParts[0];
            const initialSlash = parseInt(ipParts[1], 10);

            if (initialSlash > 30) {
                alert("/mask shouldn't be greater than 30!");
                return;
            }

            const hostBits = calculateRequiredBits(hostsInput);
            const newSlash = 32 - hostBits;

            if (powerOfTwo > initialSlash) {
                alert("The subnet mask for the desired number of hosts must be larger than the initial subnet mask.");
                return;
            }

            const results = calculateSubnet(ipAddress, hostsInput, initialSlash);
            displayResults(results, form);
            sortTableDevices(form.closest('.tableContainer').querySelector('.networkTable'));
            assignIPAddresses(form.closest('.tableContainer').querySelector('.networkTable'), results.firstHostAddress, results.lastHostAddress);
        });
    }

    function calculateRequiredBits(numHosts) {
        let bits = 0;
        while (Math.pow(2, bits) - 2 < numHosts) {
            bits++;
        }
        return bits;
    }

    function calculateSubnet(ipAddress, numHosts, initialSlash) {
        function decToBin(dec) {
            return dec.toString(2).padStart(8, '0');
        }

        function ipToBin(ip) {
            return ip.split('.').map(dec => decToBin(parseInt(dec, 10))).join('');
        }

        function binToIp(bin) {
            return bin.match(/.{8}/g).map(b => parseInt(b, 2)).join('.');
        }

        function calculateSubnetMask(prefixLength) {
            return ('1'.repeat(prefixLength) + '0'.repeat(32 - prefixLength)).match(/.{8}/g).map(bin => parseInt(bin, 2));
        }

        const hostBits = calculateRequiredBits(numHosts);
        const prefixLength = 32 - hostBits;

        const subnetMask = calculateSubnetMask(prefixLength);

        const ipBin = ipToBin(ipAddress);
        const initialAddressBin = ipBin.slice(0, prefixLength) + '0'.repeat(hostBits);

        const initialAddressParts = initialAddressBin.match(/.{8}/g).map(bin => parseInt(bin, 2));

        const firstHostBin = initialAddressBin.slice(0, 31) + '1';
        const firstHostParts = firstHostBin.match(/.{8}/g).map(bin => parseInt(bin, 2));

        const broadcastAddressBin = ipBin.slice(0, prefixLength) + '1'.repeat(hostBits);
        const broadcastAddressParts = broadcastAddressBin.match(/.{8}/g).map(bin => parseInt(bin, 2));

        const networkAddressBin = ipBin.slice(0, prefixLength) + '0'.repeat(32 - prefixLength);
        const networkAddressParts = networkAddressBin.match(/.{8}/g).map(bin => parseInt(bin, 2));

        const networkAddress = networkAddressParts.join('.');
        const firstHostAddress = firstHostParts.join('.');
        const broadcastAddress = broadcastAddressParts.join('.');
        const subnetMaskAddress = subnetMask.join('.');

        const lastHostAddress = calculateLastHostAddress(broadcastAddress);

        nextHostAddress = firstHostAddress;

        return { networkAddress, subnetMaskAddress, broadcastAddress, firstHostAddress, lastHostAddress };
    }

    function calculateLastHostAddress(broadcastAddress) {
        function ipToBin(ip) {
            return ip.split('.').map(dec => dec.toString(2).padStart(8, '0')).join('');
        }

        function binToIp(bin) {
            return bin.match(/.{8}/g).map(b => parseInt(b, 2)).join('.');
        }

        let broadcastBin = ipToBin(broadcastAddress);
        let lastHostBin = (parseInt(broadcastBin, 2) - 1).toString(2).padStart(32, '0');
        let lastHostAddress = binToIp(lastHostBin);

        return lastHostAddress;
    }

    function displayResults(results, form) {
        const resultTable = document.createElement('table');
        resultTable.innerHTML = `
            <tr>
                <th>Network Address</th>
                <th>Subnet Mask</th>
                <th>Broadcast Address</th>
                <th>First Host Address</th>
                <th>Last Host Address</th>
            </tr>
            <tr>
                <td>${results.networkAddress}</td>
                <td>${results.subnetMaskAddress}</td>
                <td>${results.broadcastAddress}</td>
                <td>${results.firstHostAddress}</td>
                <td>${results.lastHostAddress}</td>
            </tr>
        `;

        const networkNameDiv = document.createElement('div');
        networkNameDiv.classList.add('network-name');
        networkNameDiv.contentEditable = true;
        networkNameDiv.textContent = 'Network Name';

        form.insertAdjacentElement('afterend', networkNameDiv);
        networkNameDiv.insertAdjacentElement('afterend', resultTable);
    }

    const tableTemplate = document.querySelector('.tableContainer').cloneNode(true);

    document.querySelector('#addTable').addEventListener('click', function () {
    const newTable = tableTemplate.cloneNode(true);
        document.querySelector('#tablesContainer').appendChild(newTable);

        initializeForm(newTable.querySelector('.subnetForm'));
        addRemoveTableListener(newTable);
    });

    function addRemoveTableListener(tableContainer) {
        const removeButton = tableContainer.querySelector('.removeTable');
            removeButton.addEventListener('click', function () {
                tableContainer.remove();
        });
    }

    document.querySelectorAll('.subnetForm').forEach(form => initializeForm(form));
    document.querySelectorAll('.tableContainer').forEach(tableContainer => addRemoveTableListener(tableContainer));


    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('addRow')) {
            const table = event.target.closest('.tableContainer').querySelector('.networkTable');
            const newRow = table.insertRow();
            newRow.innerHTML = `
                <td>
                    <select class="device">
                        <option value="Router">Router</option>
                        <option value="Server">Server</option>
                        <option value="Printer">Printer</option>
                        <option value="PC">PC</option>
                        <option value="Laptop">Laptop</option>
                        <option value="Phone">Phone</option>
                        <option value="Tablet">Tablet</option>
                    </select>
                </td>
                <td>
                    <select>
                        <option value="G0/0">G0/0</option>
                        <option value="G0/1">G0/1</option>
                        <option value="G0/2">G0/2</option>
                        <option value="FastEthernet0">FastEthernet0</option>
                    </select>
                </td>
                <td class="address" contenteditable="true">${nextHostAddress}</td>
                <td class="nameCell" contenteditable="true" maxlength="30"></td>
                <td><button class="moveUp">Up</button> <button class="moveDown">Down</button> <button class="removeRow">Remove</button></td>
            `;

            nextHostAddress = calculateNextHostAddress(nextHostAddress);
            sortTableDevices(table);
            numberOfContainers++;
            updateButtons(table);
        }
    });

    function calculateNextHostAddress(currentAddress) {
        const parts = currentAddress.split('.').map(Number);
        for (let i = parts.length - 1; i >= 0; i--) {
            if (parts[i] < 255) {
                parts[i]++;
                break;
            } else {
                parts[i] = 0;
            }
        }

        const nextAddress = parts.join('.');

        if (nextAddress === lastAddress) {
            return null;
        }

        return nextAddress;
    }

    function sortTableDevices(table) {
        const rows = Array.from(table.querySelectorAll('tr:not(:first-child)'));

        rows.sort((rowA, rowB) => {
            const deviceA = rowA.querySelector('.device').value;
            const deviceB = rowB.querySelector('.device').value;

            const priority = ['Router', 'Server', 'Printer'];
            const priorityA = priority.indexOf(deviceA) !== -1 ? priority.indexOf(deviceA) : Infinity;
            const priorityB = priority.indexOf(deviceB) !== -1 ? priority.indexOf(deviceB) : Infinity;

            return priorityA - priorityB;
        });

        rows.forEach(row => table.appendChild(row));
    }

    document.getElementById('addTable').addEventListener('click', addTable);
    document.querySelectorAll('.subnetForm').forEach(initializeForm);
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('addRow')) {
            addRow(event);
        } 
        else  if (event.target.classList.contains('device')) {
            const table = event.target.closest('.networkTable');
            sortTableDevices(table);
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('removeRow') && numberOfContainers>2) {
            const row = event.target.closest('tr');
            const table = row.closest('table');
            numberOfContainers--;
            row.remove();
            updateButtons(table);
        } else if (event.target.classList.contains('moveUp')) {
            moveUpRow(event);
        } else if (event.target.classList.contains('moveDown')) {
            moveDownRow(event);
        } else if (event.target.classList.contains('removeTable')) {
            removeTable(event);
        } else if (event.target.classList.contains('assignIP')) {
            const table = event.target.closest('.tableContainer').querySelector('.networkTable');
            const firstHostAddress = table.dataset.firstHostAddress;
            const lastHostAddress = table.dataset.lastHostAddress;
            if (firstHostAddress && lastHostAddress) {
                assignIPAddresses(table, firstHostAddress, lastHostAddress);
            } else {
                alert('Please enter a valid IPv4 address and number of hosts, then submit the form.');
            }
        }
    });
});
