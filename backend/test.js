async function secFunc(){
    for(var i = 0; i < 1000; i++)
        continue;
    return 100;
}
function myFunc(){
    var dataLen = 0;
    dataLen = secFunc();
    return dataLen;
}

console.log(myFunc())