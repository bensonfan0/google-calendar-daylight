let currentUrl = location.href
let daylightObjectPromise

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === "childList" && location.href !== currentUrl) {
            currentUrl = location.href;
            performUIChanges()
        }
    });
});

// Start observing the document's title attribute (which changes on URL changes in SPAs)
observer.observe(document.querySelector("title"), { childList: true });

// initial load
setTimeout(() => {
    performUIChanges()
}, 600);


function isHourLabelsContainer(node) {
    const hours = [
        "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM",
        "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"
    ]
    if (node.childNodes.length === 0) return false
    let count = 0

    let i = 0
    for (const child of node.childNodes) {
        if (isCorrectHourLabelText(child, hours[i])) {
            count++
        } else {
            break
        }

        i++
    }
    return count == 24
}

function isCorrectHourLabelText(hourLabelNode, hourString) {
    if (hourLabelNode.childNodes.length != 1) return false
    let isCorrectHourLabel = true
    // Only a span element inside
    hourLabelNode.childNodes.forEach(child => {
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
    daylightObjectPromise.then(data => {
        sunrise = new Date(data.results.sunrise)
        sunset = new Date(data.results.sunset)
        astronomical_twilight_begin = new Date(data.results.astronomical_twilight_begin)
        astronomical_twilight_end = new Date(data.results.astronomical_twilight_end)

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

            child.childNodes[0].style.fontWeight = 'bold'
            child.childNodes[0].style.color = '#ffffff'
            child.childNodes[0].style.fontSize = '11px'

            if (astronomical_twilight_begin.getHours() <= time && time < sunrise.getHours()) {
                child.style.backgroundColor = '#6f8f9a'
            } else if (sunrise.getHours() <= time && time < sunset.getHours()) {
                child.style.backgroundColor = '#a5cddc'
            } else if (sunset.getHours() <= time && time < astronomical_twilight_end.getHours()) {
                child.style.backgroundColor = '#6f8f9a'
            } else {
                child.style.backgroundColor = '#2f454d'
            }
        })
    })
}

function performUIChanges() {
    console.log("setting daylight twilight UI changes")
    daylightObjectPromise = fetchDaylightObjectPromise()
    traverseDOMAndUpdateNodes(document.body)
}

function traverseDOMAndUpdateNodes(node) {
    const parts = currentUrl.split("/");
    if (!parts.includes("week") && !parts.includes("day") ) return
    if (isHourLabelsContainer(node)) {
        changeHourColor(node)
        return // base case recursion
    }

    node.childNodes.forEach(child => {
        if (child.nodeType === 1) {
            traverseDOMAndUpdateNodes(child);
        }
    });
}

async function fetchDaylightObjectPromise() {
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                lat = position.coords.latitude;
                lon = position.coords.longitude;
                
                console.log(lat,lon)
                fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0&date=${getDateFromURL()}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        resolve(response.json())
                    })
                    .catch(error => {
                        console.error('Error fetching data:', error);
                    })
            },
            (err) => {
                console.warn(`ERROR(${err.code}): ${err.message}`);
            }
        )
    }, (reject) => {
        console.log(reject)
    })
}

function getDateFromURL() {
    const parts = currentUrl.split("/");

    if (parts[parts.length-1] === 'week' || parts[parts.length-1] === 'day') return 'today'

    return parts.slice(-3).join("-");
}
