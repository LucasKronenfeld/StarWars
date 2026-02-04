using System.Net.Http.Json;

namespace Tests.Integration.Helpers;

/// <summary>
/// HTTP client extensions for cleaner test code.
/// </summary>
public static class HttpClientExtensions
{
    /// <summary>
    /// Posts JSON and returns the deserialized response.
    /// </summary>
    public static async Task<(HttpResponseMessage Response, T? Content)> PostAsJsonAndReadAsync<T>(
        this HttpClient client, 
        string requestUri, 
        object content)
    {
        var response = await client.PostAsJsonAsync(requestUri, content);
        
        if (!response.IsSuccessStatusCode)
            return (response, default);

        var result = await response.Content.ReadFromJsonAsync<T>();
        return (response, result);
    }

    /// <summary>
    /// Gets JSON and returns the deserialized response.
    /// </summary>
    public static async Task<(HttpResponseMessage Response, T? Content)> GetAsJsonAsync<T>(
        this HttpClient client, 
        string requestUri)
    {
        var response = await client.GetAsync(requestUri);
        
        if (!response.IsSuccessStatusCode)
            return (response, default);

        var result = await response.Content.ReadFromJsonAsync<T>();
        return (response, result);
    }

    /// <summary>
    /// Patches JSON and returns the response.
    /// </summary>
    public static async Task<HttpResponseMessage> PatchAsJsonAsync<T>(
        this HttpClient client, 
        string requestUri, 
        T content)
    {
        var request = new HttpRequestMessage(HttpMethod.Patch, requestUri)
        {
            Content = JsonContent.Create(content)
        };
        return await client.SendAsync(request);
    }
}
