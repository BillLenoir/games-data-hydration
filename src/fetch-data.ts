export async function fetchData(path: string, paramater: string | number) {
  const bggBaseURL = process.env.BGG_URL ?? "https://boardgamegeek.com/xmlapi/";
  const requestUrl = `${bggBaseURL}${path}/${paramater}`;
  //  const response = await fetch(requestUrl);
  let response;
  try {
    response = await fetch(requestUrl);
  } catch (error) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      `An error occurred during the fetch: ${error}`,
    );
    // Handle the error as needed
  }

  if (typeof response != "undefined") {
    //    console.log(`Done fetching ${paramater}, => ${response.body}`);
    let rawResponse;
    try {
      rawResponse = await response.text();
    } catch (error) {
      console.error(
        "\x1b[31m%s\x1b[0m",
        `An error occurred with the response: ${error}`,
      );
    }
    return rawResponse;
  }
}
