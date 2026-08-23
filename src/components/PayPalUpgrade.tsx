"use client";

import { PayPalButtons } from "@paypal/react-paypal-js";

export default function PayPalUpgrade() {

return (


<div>

<h3>
Upgrade to Professional
</h3>


<PayPalButtons

style={{
shape:"pill",
color:"gold",
layout:"vertical"
}}


createSubscription={(data, actions)=>{

  console.log(
    "PLAN:",
    process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID
  );
return actions.subscription.create({



plan_id:
process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID!

});

}}


onApprove={async(data)=>{

console.log(
"Subscription ID:",
data.subscriptionID
);


const res =
await fetch(
"/api/paypal/activate",
{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

subscriptionId:
data.subscriptionID

})

});


const result =
await res.json();


if(result.success){

alert(
"Professional activated!"
);

window.location.reload();

}
else{

alert(result.error);

}

}}
onError={(err)=>{

console.error(
"PAYPAL ERROR:",
err
);

alert(
"PayPal error. Check console."
);

}}
/>

</div>


);

}
