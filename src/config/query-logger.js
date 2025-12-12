const colors = {
    reset: '\x1b[0m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

function formatQuery(query) {
    return query
        .replace(/\n\s+/g, ' ')
        .trim();
}

async function executeQueryWithLogging(executeQueryFn, query, params = []) {
    const timestamp = new Date().toISOString();
    const requestId = Math.random().toString(36).substring(7).toUpperCase();
    
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}[${timestamp}] REQUEST ID: ${requestId}${colors.reset}`);
    console.log(`${colors.blue}📋 QUERY:${colors.reset}`);
    console.log(`${formatQuery(query)}`);
    console.log(`${colors.yellow}📝 PARAMS:${colors.reset}`, JSON.stringify(params, null, 2));
    
    try {
        const startTime = Date.now();
        const result = await executeQueryFn(query, params);
        const duration = Date.now() - startTime;
        
        console.log(`${colors.green}✅ SUCCESS (${duration}ms)${colors.reset}`);
        
        if (result.rows) {
            console.log(`${colors.green}📊 ROWS AFFECTED/RETURNED: ${result.rows.length}${colors.reset}`);
            if (result.rows.length > 0 && result.rows.length <= 3) {
                console.log(`${colors.green}📋 DATA:${colors.reset}`, JSON.stringify(result.rows, null, 2));
            }
        }
        
        console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
        return result;
    } catch (err) {
        const duration = Date.now() - startTime;
        console.log(`${colors.red}❌ ERROR (${duration}ms)${colors.reset}`);
        console.log(`${colors.red}Error Message: ${err.message}${colors.reset}`);
        console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
        throw err;
    }
}

module.exports = { executeQueryWithLogging };