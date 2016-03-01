<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><%= trans.page_title %></title>

  <meta name="viewport" content="width=device-width">

  <link rel="stylesheet" href="<%= assetsBase %>main.css">

  <link href='https://fonts.googleapis.com/css?family=Lato:400,300&subset=latin,latin-ext' rel='stylesheet' type='text/css'>
</head>
<body>

  <header class="page-header">
    <h1 class="page-header__title"><%= trans.page_title %></h1>
    <p class="page-header__desc"><%= trans.page_description %></p>

    <iframe src="https://ghbtns.com/github-btn.html?user=kfiku&repo=LoanJS&type=star&count=true" frameborder="0" scrolling="0" width="100px" height="20px"></iframe>
    <iframe src="https://ghbtns.com/github-btn.html?user=kfiku&repo=LoanJS&type=fork&count=true" frameborder="0" scrolling="0" width="100px" height="20px"></iframe>


  </header>

  <div class="table-responsive">
    <table>
      <thead>
        <tr>
          <th rowspan="2">#</th>
          <th rowspan="2"><%= trans.credit_amount %></th>
          <th rowspan="2"><%= trans.installments_quantity %></th>
          <th rowspan="2" class="table-hr"><%= trans.interest %></th>
          <th colspan="3" class="table-hr no-border"><%= trans.equal_installments %></th>
          <th colspan="4" class="table-hr no-border"><%= trans.diminishing_installments %></th>
          <th rowspan="2"></th>
        </tr>
        <tr>
          <th><%= trans.interest_sum %></th>
          <th><%= trans.installment_amount %></th>
          <th class="table-hr"></th>
          <th><%= trans.interest_sum %></th>
          <th><%= trans.first_installment_amount %></th>
          <th><%= trans.last_installment_amount %></th>
          <th class="table-hr"></th>
        </tr>
      </thead>
      <tbody id="mainTbody">

      </tbody>
    </table>
  </div>

  <div class="tc">
    <button id="addCompareRow"><%= trans.add_new_row %></button>
  </div>

  <hr>

  <div id="chart"></div>

  <hr>

  <p class="tc">© Grzegorz Klimek 2016</p>

  <script>
    var lang = '<%= lang %>'
    var trans = <%= JSON.stringify(trans) %>
  </script>
  <script src="<%= assetsBase %>js/main.js"></script>

  <% if (env === 'dev') { %>
    <script>console.log('::LIVERELOAD::');</script>
    <script src="//localhost:9091"></script>
  <% } %>
</body>
</html>
