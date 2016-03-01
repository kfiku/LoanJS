<!--<tr>-->
  <td><%= data.id %></td>
  <td><input class="amount" type="text" value="<%= data.amount%>"></td>
  <td><input class="quantity" type="text" value="<%= data.quantity %>"></td>
  <td><input class="interest" type="text" value="<%= data.interest %>"></td>
  <td><span class="equalInterestSum"><%= data.equalInterestSum %></span></td>
  <td><span class="equalInstallmentAmount"><%= data.equalInstallmentAmount %></span></td>
  <td><button class="equalDetails"><%= trans.details %></button></td>
  <td><span class="diminishingInterestsSum"><%= data.diminishingInterestsSum %></span></td>
  <td><span class="diminishingFirstInstallmentAmount"><%= data.diminishingFirstInstallmentAmount %></span></td>
  <td><span class="diminishingLastInstallmentAmount"><%= data.diminishingLastInstallmentAmount %></span></td>
  <td><button class="diminishingDetails"><%= trans.details %></button></td>
  <td>
    <button class="remove">X</button>
  </td>
<!--</tr>-->
