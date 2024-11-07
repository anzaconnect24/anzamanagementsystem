// Variable Declarations
VAR
    SendTimer: TON; // Timer for 1-minute interval
    sendDataFlag: BOOL := FALSE; // Flag to indicate when to send data
    jsonData: STRING[255]; // JSON payload to hold electricity usage data
    url: STRING := 'https://api.kwanza.io/plc-data'; // URL endpoint
    responseStatus: INT; // Response status from the HTTP POST request
    electricityUsage: REAL; // Variable to hold current electricity usage reading
END_VAR

// Timer Configuration for 1 Minute (60,000 ms)
SendTimer(IN := TRUE, PT := T#60s);

// Check if Timer has elapsed
IF SendTimer.Q THEN
    sendDataFlag := TRUE; // Set flag to send data
    SendTimer(IN := FALSE); // Stop the timer to reset it
END_IF

// Retrieve electricity usage data
// Assuming `ReadElectricityUsage()` is a function provided by your PLC to read the usage data
electricityUsage := ReadElectricityUsage();

// Prepare JSON data
jsonData := CONCAT('{"electricityUsage": ', REAL_TO_STRING(electricityUsage), '}');

// Send data when flag is set
IF sendDataFlag THEN
    // Make HTTP POST request
    responseStatus := HTTP_Post(url, jsonData);

    // Check if data sent successfully
    IF responseStatus = 200 THEN
        // Successfully sent data
    ELSE
        // Handle error, e.g., log or retry
    END_IF;

    // Reset flag and restart timer for the next interval
    sendDataFlag := FALSE;
    SendTimer(IN := TRUE);
END_IF
