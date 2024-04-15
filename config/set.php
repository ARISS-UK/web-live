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


echo  json_encode($_POST);

$contact_upcoming = $_POST["contact_upcoming"];
$real_youtube_uri = $_POST["real_youtube_uri"];
$test_youtube_uri = $_POST["test_youtube_uri"];
$contact_school = $_POST["contact_school"];
$contact_description = $_POST["contact_description"];
$contact_latitude = $_POST["contact_latitude"];
$contact_longitude = $_POST["contact_longitude"];
$contact_datetime = $_POST["contact_datetime"];

$json_output = json_encode([
    'contact_upcoming' => $contact_upcoming == "true",
    'youtube_uri' => $real_youtube_uri,
    'test_youtube_uri' => $test_youtube_uri,
    'contact_school' => $contact_school,
    'contact_description' => $contact_description,
    'contact_location' => [
        'latitude' => $contact_latitude,
        'longitude' => $contact_longitude
    ],
    'contact_datetime' => $contact_datetime
]);

file_put_contents('../youtube.json', $json_output);

?>
