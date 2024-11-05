console.log(document.body)

let daylightObject = fetchDaylightObjectPromise() // PROMISE

daylightObject.then(data => {
    console.log(data)
})

setTimeout(() => {
    traverseDOM(document.body);
}, 2000);


function isHourLabelsContainer(node) {
    let hours = [
        "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM",
        "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"
    ]
    if (node.childNodes.length === 0) return false
    let count = 0

    node.childNodes.forEach((child, i) => {
        if (isCorrectHourLabelText(child, hours[i])) {
            count++
        }
    })
    return count == 24
}

function isCorrectHourLabelText(hourLabel, hourString) {
    if (hourLabel.childNodes.length != 1) return false
    let isCorrectHourLabel = true
    // Only a span element inside
    hourLabel.childNodes.forEach(child => {
        const text = child.textContent.trim();
        isCorrectHourLabel &= (text === hourString)
    })

    return isCorrectHourLabel
}

function changeHourColor(node) {
    /*
    astronomical_twilight_begin
    astronomical_twilight_end
    civil_twilight_begin
    civil_twilight_end

    nautical_twilight_begin
    nautical_twilight_end
    */
    let sunrise
    let sunset

    daylightObject.then(data => {
        sunrise = new Date(data.results.sunrise)
        sunset = new Date(data.results.sunset)


        node.childNodes.forEach(child => {
            timeAndModifierArray = child.textContent.trim().split(" ")
            
            if (timeAndModifierArray.length != 2) return
            
            time = Number(timeAndModifierArray[0])
            modifier = timeAndModifierArray[1].toLowerCase()
            
            if (time == 12 && modifier == "am") {
                time = 0
            } else if (modifier === "pm" && time != 12) {
                time += 12
            }
            
            // Not sure why UTC is okay for this
            console.log("time " + time)
            console.log("sunrise " + sunrise.getUTCHours())
            console.log("sunset " + sunset.getUTCHours())
            
            child.childNodes[0].style.fontWeight = 'bold'
            if (sunrise.getUTCHours() <= time && time < sunset.getUTCHours()) {
                child.style.backgroundColor = '#fffe00'
            } else {
                child.childNodes[0].style.color = '#ffffff'
                child.style.backgroundColor = '#0010a0'
            }
        })
    })

}

function traverseDOM(node) {
    if (isHourLabelsContainer(node)) {
        changeHourColor(node)
        return // base case recursion
    }

    node.childNodes.forEach(child => {
        if (child.nodeType === 1) {
            traverseDOM(child);
        }
    });
}

function fetchDaylightObjectPromise() {
    let lat, lon
    navigator.geolocation.getCurrentPosition(
        (position) => {
            lat = position.coords.latitude;
            lon = position.coords.longitude;
        }
    )
    return fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}
