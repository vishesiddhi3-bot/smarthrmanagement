// ======================================================
// TRAVELEASE - BOOKING.JS
// COMPLETE READY-TO-PASTE VERSION
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("TravelEase Booking JS Loaded");

    // ==================================================
    // GET PACKAGE ID FROM URL
    // ==================================================

    const urlParams = new URLSearchParams(window.location.search);

    const packageId =
        (urlParams.get("id") || "maldives")
            .toLowerCase()
            .trim();

    console.log("Package ID:", packageId);


    // ==================================================
    // PACKAGE DATA
    // ==================================================

    const packages = {

        maldives: {
            name: "Maldives Paradise",
            location: "Maldives",
            duration: "5 Days / 4 Nights",
            price: 25999
        },

        goa: {
            name: "Goa Beach Escape",
            location: "Goa, India",
            duration: "4 Days / 3 Nights",
            price: 18999
        },

        manali: {
            name: "Manali Mountain Escape",
            location: "Manali, Himachal Pradesh",
            duration: "5 Days / 4 Nights",
            price: 22999
        },

        dubai: {
            name: "Dubai Luxury Escape",
            location: "Dubai, UAE",
            duration: "5 Days / 4 Nights",
            price: 35999
        },

        kerala: {
            name: "Kerala Backwater Escape",
            location: "Kerala, India",
            duration: "5 Days / 4 Nights",
            price: 24999
        },

        rajasthan: {
            name: "Royal Rajasthan Tour",
            location: "Rajasthan, India",
            duration: "6 Days / 5 Nights",
            price: 29999
        },

        kashmir: {
            name: "Kashmir Paradise",
            location: "Kashmir, India",
            duration: "6 Days / 5 Nights",
            price: 32999
        },

        bali: {
            name: "Bali Tropical Escape",
            location: "Bali, Indonesia",
            duration: "6 Days / 5 Nights",
            price: 39999
        },

        thailand: {
            name: "Thailand Island Escape",
            location: "Thailand",
            duration: "6 Days / 5 Nights",
            price: 34999
        },

        switzerland: {
            name: "Swiss Alps Experience",
            location: "Switzerland",
            duration: "7 Days / 6 Nights",
            price: 89999
        }

    };


    // ==================================================
    // SELECT PACKAGE
    // ==================================================

    const selectedPackage = packages[packageId];

    if (!selectedPackage) {

        console.error("Package not found:", packageId);

        alert("Package not found.");

        window.location.href = "home.html#packages";

        return;
    }

    console.log("Selected Package:", selectedPackage);


    // ==================================================
    // HELPER FUNCTIONS
    // ==================================================

    function getElement(id) {
        return document.getElementById(id);
    }


    function setText(id, value) {

        const element = getElement(id);

        if (element) {
            element.textContent = value;
        }
    }


    // ==================================================
    // LOAD PACKAGE INFORMATION
    // ==================================================

    setText(
        "bookingPackageName",
        selectedPackage.name
    );

    setText(
        "bookingDestination",
        "📍 " + selectedPackage.location
    );

    setText(
        "bookingDuration",
        selectedPackage.duration
    );

    setText(
        "bookingPrice",
        "₹" + selectedPackage.price.toLocaleString("en-IN")
    );


    // ==================================================
    // GET FORM ELEMENTS
    // ==================================================

    const bookingForm =
        getElement("bookingForm");

    const confirmButton =
        getElement("confirmBookingBtn");

    const personsInput =
        getElement("persons");

    const summaryPersons =
        getElement("summaryPersons");

    const totalAmount =
        getElement("totalAmount");


    console.log("Form:", bookingForm);
    console.log("Confirm Button:", confirmButton);


    // ==================================================
    // CHECK BUTTON
    // ==================================================

    if (!confirmButton) {

        console.error(
            "ERROR: confirmBookingBtn not found."
        );

        return;
    }


    // ==================================================
    // MAKE BUTTON CLICKABLE
    // ==================================================

    confirmButton.disabled = false;
    confirmButton.style.pointerEvents = "auto";
    confirmButton.style.cursor = "pointer";


    // ==================================================
    // TOTAL PRICE CALCULATION
    // ==================================================

    function updateTotal() {

        let persons = parseInt(
            personsInput ? personsInput.value : 1,
            10
        );

        if (isNaN(persons) || persons < 1) {

            persons = 1;

            if (personsInput) {
                personsInput.value = "1";
            }
        }

        if (persons > 20) {

            persons = 20;

            if (personsInput) {
                personsInput.value = "20";
            }
        }

        const total =
            selectedPackage.price * persons;


        if (summaryPersons) {
            summaryPersons.textContent = persons;
        }


        if (totalAmount) {

            totalAmount.textContent =
                "₹" + total.toLocaleString("en-IN");

        }
    }


    if (personsInput) {

        personsInput.addEventListener(
            "input",
            updateTotal
        );

        personsInput.addEventListener(
            "change",
            updateTotal
        );
    }


    updateTotal();


    // ==================================================
    // SET MINIMUM TRAVEL DATE
    // ==================================================

    const travelDate =
        getElement("travelDate");


    if (travelDate) {

        const today = new Date();

        const year =
            today.getFullYear();

        const month =
            String(today.getMonth() + 1).padStart(2, "0");

        const day =
            String(today.getDate()).padStart(2, "0");


        // CORRECTED LINE
        travelDate.min =
            `${year}-${month}-${day}`;
    }


    // ==================================================
    // BOOKING FUNCTION
    // ==================================================

    function processBooking() {

        console.log("Confirm Booking clicked");


        // ==================================================
        // GET FORM VALUES
        // ==================================================

        const nameElement =
            getElement("customerName");

        const emailElement =
            getElement("customerEmail");

        const phoneElement =
            getElement("customerPhone");

        const dateElement =
            getElement("travelDate");

        const personsElement =
            getElement("persons");

        const requestElement =
            getElement("specialRequest");

        const termsElement =
            getElement("terms");


        const name =
            nameElement ?
            nameElement.value.trim() :
            "";


        const email =
            emailElement ?
            emailElement.value.trim() :
            "";


        const phone =
            phoneElement ?
            phoneElement.value.trim() :
            "";


        const date =
            dateElement ?
            dateElement.value :
            "";


        const persons =
            parseInt(
                personsElement ?
                personsElement.value :
                "1",
                10
            ) || 1;


        const specialRequest =
            requestElement ?
            requestElement.value.trim() :
            "";


        const termsAccepted =
            termsElement ?
            termsElement.checked :
            false;


        // ==================================================
        // VALIDATE NAME
        // ==================================================

        if (name.length < 2) {

            alert(
                "Please enter your full name."
            );

            if (nameElement) {
                nameElement.focus();
            }

            return false;
        }


        // ==================================================
        // VALIDATE EMAIL
        // ==================================================

        if (email === "") {

            alert(
                "Please enter your email address."
            );

            if (emailElement) {
                emailElement.focus();
            }

            return false;
        }


        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailPattern.test(email)) {

            alert(
                "Please enter a valid email address."
            );

            if (emailElement) {
                emailElement.focus();
            }

            return false;
        }


        // ==================================================
        // VALIDATE PHONE
        // ==================================================

        if (phone === "") {

            alert(
                "Please enter your phone number."
            );

            if (phoneElement) {
                phoneElement.focus();
            }

            return false;
        }


        const cleanPhone =
            phone.replace(/\D/g, "");


        if (cleanPhone.length < 10) {

            alert(
                "Please enter a valid phone number."
            );

            if (phoneElement) {
                phoneElement.focus();
            }

            return false;
        }


        // ==================================================
        // VALIDATE DATE
        // ==================================================

        if (date === "") {

            alert(
                "Please select your travel date."
            );

            if (dateElement) {
                dateElement.focus();
            }

            return false;
        }


        // ==================================================
        // VALIDATE PERSONS
        // ==================================================

        if (
            persons < 1 ||
            persons > 20
        ) {

            alert(
                "Number of travellers must be between 1 and 20."
            );

            if (personsElement) {
                personsElement.focus();
            }

            return false;
        }


        // ==================================================
        // VALIDATE TERMS
        // ==================================================

        if (
            termsElement &&
            !termsAccepted
        ) {

            alert(
                "Please accept the booking terms before continuing."
            );

            termsElement.focus();

            return false;
        }


        // ==================================================
        // CALCULATE TOTAL
        // ==================================================

        const total =
            selectedPackage.price * persons;


        // ==================================================
        // CREATE BOOKING ID
        // ==================================================

        const bookingId =
            "TE-" +
            Date.now()
                .toString()
                .slice(-8);


        // ==================================================
        // CREATE BOOKING OBJECT
        // ==================================================

        const booking = {

            bookingId: bookingId,

            packageId: packageId,

            packageName:
                selectedPackage.name,

            destination:
                selectedPackage.location,

            duration:
                selectedPackage.duration,

            pricePerPerson:
                selectedPackage.price,

            customerName:
                name,

            customerEmail:
                email,

            customerPhone:
                phone,

            travelDate:
                date,

            persons:
                persons,

            specialRequest:
                specialRequest,

            totalAmount:
                total,

            status:
                "Confirmed",

            createdAt:
                new Date().toISOString()
        };


        console.log(
            "Booking:",
            booking
        );


        // ==================================================
        // GET EXISTING BOOKINGS
        // ==================================================

        let bookings = [];

        try {

            const savedBookings =
                localStorage.getItem(
                    "traveleaseBookings"
                );


            if (savedBookings) {

                bookings =
                    JSON.parse(
                        savedBookings
                    );
            }


            if (!Array.isArray(bookings)) {
                bookings = [];
            }

        } catch (error) {

            console.error(
                "Could not read previous bookings:",
                error
            );

            bookings = [];
        }


        // ==================================================
        // ADD NEW BOOKING
        // ==================================================

        bookings.push(booking);


        // ==================================================
        // SAVE BOOKING
        // ==================================================

        try {

            localStorage.setItem(
                "traveleaseBookings",
                JSON.stringify(bookings)
            );


            localStorage.setItem(
                "latestTravelEaseBooking",
                JSON.stringify(booking)
            );

        } catch (error) {

            console.error(
                "Could not save booking:",
                error
            );

            alert(
                "Unable to save booking. Please try again."
            );

            return false;
        }


        // ==================================================
        // BUTTON SUCCESS STATE
        // ==================================================

        confirmButton.disabled = true;

        confirmButton.textContent =
            "Booking Confirmed ✓";


        // ==================================================
        // GO TO CONFIRMATION PAGE
        // ==================================================

        window.location.href =
            "booking-confirmation.html?id=" +
            encodeURIComponent(bookingId);


        return true;
    }


    // ==================================================
    // BUTTON CLICK
    // ==================================================

    confirmButton.addEventListener(
        "click",
        function (event) {

            console.log(
                "Confirm button CLICK detected"
            );

            event.preventDefault();

            processBooking();
        }
    );


    // ==================================================
    // FORM SUBMIT
    // ==================================================

    if (bookingForm) {

        bookingForm.addEventListener(
            "submit",
            function (event) {

                console.log(
                    "Booking form SUBMIT detected"
                );

                event.preventDefault();

                processBooking();
            }
        );
    }


    // ==================================================
    // LOGOUT
    // ==================================================

    const logoutBtn =
        getElement("logoutBtn");


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            function () {

                localStorage.removeItem(
                    "loggedInUser"
                );

                localStorage.removeItem(
                    "travelEaseUser"
                );

                window.location.href =
                    "login.html";
            }
        );
    }


    // ==================================================
    // WELCOME USER
    // ==================================================

    const welcomeUser =
        getElement("welcomeUser");


    if (welcomeUser) {

        let user = null;

        try {

            const savedUser =
                localStorage.getItem(
                    "loggedInUser"
                );


            if (savedUser) {

                user =
                    JSON.parse(
                        savedUser
                    );
            }

        } catch (error) {

            console.log(
                "User data not available."
            );
        }


        if (user) {

            if (typeof user === "string") {

                welcomeUser.textContent =
                    "Welcome, " + user;

            } else {

                welcomeUser.textContent =
                    "Welcome, " +
                    (
                        user.name ||
                        user.fullName ||
                        "Traveler"
                    );
            }
        }
    }


    // ==================================================
    // FINAL MESSAGE
    // ==================================================

    console.log(
        "TravelEase booking page is ready."
    );

});