<?php

/*
{
    "real_youtube_uri": "h0fFOvN3yd0",
    "contact_school": "Test School Name",
    "contact_description": "This is a test description.",
    "contact_location": {
        "latitude": 51.2,
        "longitude": -1.34
    },
    "contact_datetime": "2024-02-24 12:00:00",
    "previous_contacts": [
        {
            "text": "2023-10-18 - St-Peter-In-Thanet CE Junior School, UK",
            "link": "https://youtu.be/lnPlIHGV-YE"
        }
    ]
}
*/

echo json_encode($_POST);

$info_html = $_POST["info_html"];
$player_enabled = $_POST["player_enabled"];
$player_youtube_url = $_POST["player_youtube_url"];
$visibility_enabled = $_POST["visibility_enabled"];
$visibility_latitude = $_POST["visibility_latitude"];
$visibility_longitude = $_POST["visibility_longitude"];

$json_output = json_encode([
    'info_html' => $info_html,
    'player_enabled' => filter_var($player_enabled, FILTER_VALIDATE_BOOLEAN),
    'player_youtube_url' => $player_youtube_url,
    'visibility_enabled' => filter_var($visibility_enabled, FILTER_VALIDATE_BOOLEAN),
    'visibility_location' => [
        'latitude' => filter_var($visibility_latitude, FILTER_VALIDATE_FLOAT),
        'longitude' => filter_var($visibility_longitude, FILTER_VALIDATE_FLOAT)
    ]
]);

file_put_contents('../live-config.json', $json_output);

// Logging
date_default_timezone_set('Etc/UTC');

$logfilename = "./" . date('Y-m-d_His') . ".txt";

$logfile = fopen($logfilename, "w") or die("Unable to open file!");
fwrite($logfile, 'POST:\n');
fwrite($logfile, json_encode($_POST));
fwrite($logfile, '\nOutput:\n');
fwrite($logfile, $json_output);
fclose($logfile);

?>
