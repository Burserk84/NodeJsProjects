/**
 * GitHub Repository Fetcher
 * 
 * A script to fetch the most starred repositories from GitHub within a specified date range.
 * Uses GitHub's REST API via Octokit to perform authenticated searches and handle pagination.
 * 
 * Features:
 * - Date range filtering
 * - Pagination support
 * - Rate limit monitoring
 * - Detailed repository information display
 * 
 * Required Environment Variables:
 * - GITHUB_ACCESS_TOKEN: Personal access token for GitHub API authentication
 */

import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import { isValid, parseISO } from 'date-fns';

// Load github_access_token from .env file
dotenv.config();

// Constants
const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
const PER_PAGE = 30; // GitHub API's default and maximum items per page
const API_VERSION = '2022-11-28';

// Validate required environment variables
if (!GITHUB_ACCESS_TOKEN) {
  console.error('Error: GITHUB_ACCESS_TOKEN environment variable is not set');
  process.exit(1);
}

// Initialize GitHub API client with authentication and configuration
const octokit = new Octokit({
  auth: GITHUB_ACCESS_TOKEN,
  userAgent: 'github-repo-fetcher',
  timeZone: 'UTC',
  baseUrl: 'https://api.github.com'
});

/**
 * Validates if a given date string matches the ISO format (YYYY-MM-DD)
 * 
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if date is valid or empty, false otherwise
 */
function isValidDateFormat(dateString) {
  if (!dateString) return true;
  
  try {
    const date = parseISO(dateString);
    return isValid(date);
  } catch (error) {
    return false;
  }
}

/**
 * Formats repository information for console output
 * 
 * @param {Object} repo - Repository object from GitHub API
 * @param {number} index - Display index of the repository
 * @returns {string} Formatted repository information
 */
function formatRepoInfo(repo, index) {
  return [
    `${index}. ${repo.full_name} (⭐ ${repo.stargazers_count.toLocaleString()}) - ${repo.html_url}`,
    `   Description: ${repo.description || 'No description'}`,
    `   Language: ${repo.language || 'Not specified'}`,
    `   Created: ${new Date(repo.created_at).toLocaleDateString()}\n`
  ].join('\n');
}

/**
 * Fetches the most starred repositories based on specified criteria
 * 
 * @param {string} startDate - Start date in YYYY-MM-DD format (optional)
 * @param {string} endDate - End date in YYYY-MM-DD format (optional)
 * @param {number} page - Page number for pagination (default: 1)
 * @returns {Promise<Object>} Repository data and pagination information
 * @throws {Error} If date format is invalid or API request fails
 */
async function fetchMostStarredRepos(startDate, endDate, page = 1) {
  // Validate input dates
  if (!isValidDateFormat(startDate) || !isValidDateFormat(endDate)) {
    throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
  }

  // Construct the search query
  const dateQuery = [
    startDate && endDate ? `created:${startDate}..${endDate}` :
    startDate ? `created:>=${startDate}` :
    endDate ? `created:<=${endDate}` : ''
  ].filter(Boolean);

  const q = ['stars:>0', ...dateQuery].join(' ');

  try {
    // Execute the search query
    const response = await octokit.search.repos({
      q,
      sort: 'stars',
      order: 'desc',
      per_page: PER_PAGE,
      page,
      headers: { 'X-GitHub-Api-Version': API_VERSION }
    });

    const { total_count, items: repos, incomplete_results } = response.data;

    // Display pagination information
    console.log(`\nShowing page ${page} of ${Math.ceil(total_count / PER_PAGE)}`);
    console.log(`Total repositories found: ${total_count}`);
    if (incomplete_results) {
      console.log('Warning: Results may be incomplete due to timeout');
    }

    // Process and display repository information
    if (repos?.length > 0) {
      console.log('\nTop Starred Repositories:');
      repos.forEach((repo, index) => {
        const globalIndex = ((page - 1) * PER_PAGE) + index + 1;
        console.log(formatRepoInfo(repo, globalIndex));
      });

      // Fetch and display rate limit information
      const { data: rateLimit } = await octokit.rateLimit.get();
      const searchLimit = rateLimit.resources.search;
      
      console.log('\nAPI Rate Limit Status:');
      console.log(`Remaining requests: ${searchLimit.remaining}`);
      console.log(`Reset time: ${new Date(searchLimit.reset * 1000).toLocaleString()}`);

      // Return comprehensive result object
      return {
        repos,
        total_count,
        current_page: page,
        total_pages: Math.ceil(total_count / PER_PAGE),
        has_next_page: page < Math.ceil(total_count / PER_PAGE),
        rate_limit: searchLimit
      };
    }

    console.log('No repositories found for the specified date range.');
    return null;
  } catch (error) {
    // Enhanced error handling with detailed information
    if (error.response?.data) {
      console.error('GitHub API Error:', error.response.data.message);
      error.response.data.errors?.forEach(err => {
        console.error('- ', err);
      });
    } else {
      console.error('Error fetching repositories:', error.message);
    }
    throw error;
  }
}

/**
 * Main execution function
 * Handles command line arguments and executes the repository fetch
 */
async function main() {
  try {
    const [startDate, endDate, pageArg] = process.argv.slice(2);
    const page = parseInt(pageArg) || 1;

    const result = await fetchMostStarredRepos(startDate, endDate, page);
    
    if (result?.has_next_page) {
      console.log(`\nTo see the next page, run with page ${result.current_page + 1}:`);
      console.log(`node script.js ${startDate || ''} ${endDate || ''} ${result.current_page + 1}`);
    }
  } catch (error) {
    process.exit(1);
  }
}

// Execute the script
main();