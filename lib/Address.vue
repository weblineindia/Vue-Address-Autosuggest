<!-- *************************************************************************

This File will be used to address field

************************************************************************* -->

<template>
  <div>
    <div v-show="!hide" class="streetaddress-block">
      <div v-show="notStreetNumber && isShowStreetField" class="street-block">
        <input
          v-model="streetNumber"
          type="text"
          :tabindex="tabindex"
          :class="{
            'address-street': true
          }"
          placeholder="Street Number"
          maxlength="10"
          @input="onStreetChange($event)"
          @blur="onBlurStreetNumber"
          @keypress.enter.prevent
        />
      </div>
      <div class="street-address">
        <input
          :id="id + index"
          ref="autocomplete"
          :key="index"
          v-model="addressValue[index].address"
          type="text"
          :placeholder="placeholder"
          :tabindex="tabindex"
          :maxlength="maxlength"
          :name="name + index"
          :isMultiple="isMultiple"
          :disabled="disabled"
          :class="{
          'form-control': true,
          'address-streetnumer': notStreetNumber ? true : false,
        }"
          @placechanged="getAddressData"
          @focus="onFocus($event)"
          @input="onChangeField($event)"
          @keypress="onKeyPress"
          @keyup="onKeyUp"
          @blur="onBlur($event)"
        />
      </div>
      <span v-if="isMultiple" v-show="addressValue[index].address !== ''" class="add-remove">
        <span>
          <font-awesome-icon icon="minus" />
        </span>
        <span v-if="isShowPlus">
          <font-awesome-icon
            icon="plus"
            class="pointer"
            @click.prevent="onMultipleAddressAdd(id, index)"
          />
        </span>
      </span>
    </div>
  </div>
</template>

<!-- *************************************************************************

SCRIPT

************************************************************************* -->

<script>
/*eslint-disable */
import Vue from "vue";
// For load Regex
import * as Regex from "./regex.js";
// Load font awesome
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faPlus,
  faMinus,
  faCircle,
  faClone
} from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
library.add(faPlus, faMinus, faCircle, faClone);

Vue.component("font-awesome-icon", FontAwesomeIcon);
const ADDRESS_COMPONENTS = {
  subpremise: "short_name",
  street_number: "short_name",
  route: "long_name",
  locality: "long_name",
  administrative_area_level_1: "short_name",
  administrative_area_level_2: "long_name",
  country: "long_name",
  postal_code: "short_name",
  street_name: "short_name"
};
export default {
  props: {
    id: String, // Id of the component
    name: String, // Name of the component
    tabindex: Number, // Tab index of the component
    placeholder: String, // Place holder of the component
    hide: Boolean, // To hide or show the component
    disabled: Boolean, // When present, it specifies that the component should be disabled.
    isMultiple: Boolean, // To Allow User to Add Multiple Address
    isShowPlus: Boolean, // To Hide/Show Plus(+) icon
    onMultipleAddressAdd: Function, // Method used to add multiple Address
    addressValue: {
      // Array of Object of multiple address
      type: Array[Object],
      default: [
        {
          address: "",
          geolocation: { x: 0, y: 0 },
          country: "",
          locality: "",
          postalcode: "",
          state: "",
          province: "",
          fulladdress: "",
          streetaddress: "",
          isDuplicate: false
        }
      ]
    },
    index: {
      // Key Value pair
      type: Number,
      default: 0,
      required: true
    },
    selectedCountries: {
      // Array of selected countries to restrict the suggestions
      type: Array,
      default: () => []
    },
    isShowStreetField: Boolean, // Show Street field
    streetPlaceholder: String, // The input field will get this placeholder text
    maxlength: Number //  The input maxlength
  },
  data: function() {
    return {
      addressData: "",
      isHideXAddress: false,
      notStreetNumber: false,
      streetNumber: "",
      selectedAddressArray: []
    };
  },
  /** Get and set Address Value */
  computed: {
    address: {
      get() {
        return this.addressValue;
      },
      set(dataValue) {
        return (this.addressValue = dataValue);
      }
    }
  },
  /** Get Italy address */
  watch: {
    selectedCountries: function() {
      // used for modal side bar address
      this.autocomplete.setComponentRestrictions({
        country:
          this.selectedCountries.length > 0 === null ? selectedCountries : {}
      });
    }
  },
  mounted() {
    const options = {};
    if (this.types) {
      options.types = [this.types];
    }

    options.componentRestrictions = {
      country: this.selectedCountries.length > 0 ? this.selectedCountries : {}
    };

    this.autocomplete = new window.google.maps.places.Autocomplete(
      this.$refs.autocomplete,
      options
    );
    this.autocomplete.addListener("place_changed", this.onAddressChanged);
  },
  methods: {
    /**
     * On change street number
     */
    onStreetChange() {
      const selectedAddressValue = this.addressValue[this.index];
      const selectedAddress = this.selectedAddressArray[this.index][0].address;
      this.streetNumber = this.streetNumber.replace(
        Regex.ALPHABATICS_NUMERICS_REGEX,
        ""
      );
      const streetValue = this.streetNumber
        ? this.streetNumber + " , "
        : this.streetNumber;
      const dValue = selectedAddress;
      const concatValue = streetValue.concat(dValue);
      const addressValueData = {
        address: concatValue,
        geolocation: selectedAddressValue.geolocation,
        countryCode: this.country,
        fulladdress: selectedAddressValue.fulladdress,
        country: selectedAddressValue.country,
        locality: selectedAddressValue.locality,
        streetaddress: this.streetNumber,
        premise: selectedAddressValue.premise,
        postalcode: selectedAddressValue.postalcode,
        state: selectedAddressValue.state,
        province: selectedAddressValue.province,
        isDuplicate: false
      };
      const tempArray = [];
      const options = {};
      tempArray.push(addressValueData);
      this.$emit("change", tempArray, this.id, this.index);
      this.autocomplete = new window.google.maps.places.Autocomplete(
        this.$refs.autocomplete,
        options
      );
      this.autocomplete.addListener("place_changed", this.onAddressChanged);
    },
    /**
     * When the location found
     * @param {Object} addressData Data of the found location
     * @param {Object} placeResultData PlaceResult object
     * @param {String} id Input container ID
     */
    getAddressData: function(addressData) {
      this.address = addressData;
    },
    /**
     * Unique address validation
     */
    uniqueAddressValidate() {
      if (this.addressValue.length > 1) {
        var addressArrayValue = this.addressValue.map(function(e) {
          return e.address.replace(/\s/g, "");
        });
        for (let i = 0; i < addressArrayValue.length; i++) {
          const tempArray = JSON.parse(JSON.stringify(addressArrayValue));
          tempArray.splice(i, 1);

          if (
            addressArrayValue[i] !== "" &&
            tempArray.indexOf(addressArrayValue[i]) !== -1
          ) {
            this.addressValue[i].isDuplicate = true;
          } else {
            this.addressValue[i].isDuplicate = false;
          }
        }
      }
    },
    /**
     * On Change address event
     */
    onChangeField(event) {
      this.notStreetNumber = false;
      this.streetNumber = "";
      if (event.target.value !== "") {
        this.onBlurStreetNumber();
      }
      if (this.addressValue[this.index].address.trim() === "") {
        this.addressValue[this.index].address = this.addressValue[
          this.index
        ].address
          .replace(Regex.ALPHABATICS_NUMERICS_REGEX_WITHOUT_SPACE, "")
          .trim();
      }
      this.$emit("change", this.addressValue[this.index], this.id, this.index);
      this.uniqueAddressValidate();
    },
    /**
     * Blur address event
     */
    onBlur(event) {
      this.$emit("blur", event);
    },
    onFocus(event) {
      this.$emit("focus", event);
    },
    /**
     * When a key gets pressed
     * @param  {Event} event A keypress event
     */
    onKeyPress(event) {
      this.$emit("keypress", event);
    },

    /**
     * When a keyup occurs
     * @param  {Event} event A keyup event
     */
    onKeyUp(event) {
      this.$emit("keyup", event);
    },
    /**
     * Format address
     */
    formatResult(place) {
      const returnData = [];
      let returnObject = {};
      let countryName = "";
      let locality = "";
      let postalCode = "";
      let province = "";
      let streetName = "";
      let streetNumber = "";
      let state = "";
      for (let i = 0; i < place.address_components.length; i++) {
        const addressType = place.address_components[i].types[0];

        const addressTypeValue =
          place.address_components[i][ADDRESS_COMPONENTS[addressType]];
        switch (addressType) {
          case "country":
            countryName = addressTypeValue;
            break;
          case "locality":
            locality = addressTypeValue;
            break;
          case "postal_code":
            postalCode = addressTypeValue;
            break;
          case "administrative_area_level_1":
            state = addressTypeValue;
            break;
          case "administrative_area_level_2":
            province = addressTypeValue;
            break;
          case "street_number":
            streetNumber = addressTypeValue;
            break;
          case "street_name":
            streetName = addressTypeValue;
            break;
        }
        const geolocation = {
          x: place.geometry.location.lat(),
          y: place.geometry.location.lng()
        };
        const commaSeparator = streetNumber ? ", " : "";
        const space = streetName ? " " : "";
        let selectedAddress = "";
        let address = this.$refs.autocomplete.value;
        if (address.search(streetNumber) > 0) {
          selectedAddress = this.$refs.autocomplete.value;
        } else {
          selectedAddress =
            streetNumber + commaSeparator + this.$refs.autocomplete.value;
        }
        returnObject = {
          geolocation: geolocation,
          fulladdress: selectedAddress,
          address: selectedAddress,
          country: countryName,
          locality: locality,
          streetaddress: streetNumber + space + streetName,
          premise: countryName,
          postalcode: postalCode,
          state: state,
          province: province,
          countryCode: this.country,
          isDuplicate: false
        };
      }
      if (returnObject.streetaddress === "") {
        this.notStreetNumber = true;
      } else {
        this.notStreetNumber = false;
      }
      returnData.push(returnObject);
      return returnData;
    },
    /**
     * Get the country code from the place
     */
    getCountryCode(place) {
      for (let i = 0; i < place.address_components.length; i++) {
        var addressType = place.address_components[i].types[0];
        if (addressType === "country") {
          this.country = place.address_components[i].short_name;
        }
      }
    },
    /**
     * On place change event
     */
    onAddressChanged() {
      debugger;
      const place = this.autocomplete.getPlace();
      if (place.address_components !== undefined) {
        this.getCountryCode(place);
        this.selectedAddressArray[this.index] = this.formatResult(place);
        this.$emit("change", this.formatResult(place), this.id, this.index);
      } else {
        this.value = place.name;
        const data = [];
        let geolocation = "";
        if (place.geometry !== undefined) {
          geolocation = {
            x:
              place.geometry.location.lat() === undefined
                ? ""
                : place.geometry.location.lat(),
            y:
              place.geometry.location.lng() === undefined
                ? ""
                : place.geometry.location.lat()
          };
        } else {
          geolocation = {
            x: "",
            y: ""
          };
        }
        data.push({
          address: this.value,
          geolocation: geolocation,
          countryCode: this.country,
          fulladdress: this.value,
          country: "",
          locality: "",
          streetaddress: "",
          premise: "",
          postalcode: "",
          state: "",
          province: "",
          isDuplicate: false
        });
        this.selectedAddressArray.push(data);
        this.$emit("change", data, this.id, this.index);
      }
      this.uniqueAddressValidate();
    },
    /**
     * On blur street number
     */
    onBlurStreetNumber() {
      this.notStreetNumber = false;
      this.addressValue[this.index].geolocation = {
        x: "",
        y: ""
      };
      this.addressValue[this.index].countryCode = this.addressValue[
        this.index
      ].countryCode;
      this.addressValue[this.index].fulladdress = this.addressValue[
        this.index
      ].fulladdress;
      this.addressValue[this.index].country = this.addressValue[
        this.index
      ].country;
      this.addressValue[this.index].locality = this.addressValue[
        this.index
      ].locality;
      this.addressValue[this.index].streetaddress = this.addressValue[
        this.index
      ].streetaddress;
      this.addressValue[this.index].premise = this.addressValue[
        this.index
      ].premise;
      this.addressValue[this.index].postalcode = this.addressValue[
        this.index
      ].postalcode;
      this.addressValue[this.index].state = this.addressValue[this.index].state;
      this.addressValue[this.index].province = this.addressValue[
        this.index
      ].province;
    }
  }
};
</script>
<style scoped>
@import "./style.css";
</style>