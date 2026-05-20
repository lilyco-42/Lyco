use std::net::Ipv4Addr;

/// Parse a CIDR string like "192.168.1.0/24" into a Vec of all IPv4 addresses in the range.
pub fn parse_cidr(cidr: &str) -> Result<Vec<Ipv4Addr>, String> {
    let parts: Vec<&str> = cidr.split('/').collect();
    if parts.len() != 2 {
        return Err(format!("Invalid CIDR format: {}", cidr));
    }
    let (ip_str, prefix_str) = (parts[0], parts[1]);

    if ip_str.is_empty() || prefix_str.is_empty() {
        return Err(format!("Invalid CIDR format: {}", cidr));
    }

    let ip: Ipv4Addr = ip_str
        .parse()
        .map_err(|e| format!("Invalid IP '{}': {}", ip_str, e))?;

    let prefix_len: u8 = prefix_str
        .parse()
        .map_err(|e| format!("Invalid prefix '{}': {}", prefix_str, e))?;

    if prefix_len > 32 {
        return Err(format!("Prefix length {} must be <= 32", prefix_len));
    }

    let ip_u32 = u32::from(ip);
    let mask = if prefix_len == 0 {
        0
    } else {
        u32::MAX << (32 - prefix_len)
    };
    let network = ip_u32 & mask;
    let host_bits = 32 - prefix_len;
    let count = 1u64 << host_bits;

    let mut ips = Vec::with_capacity(count as usize);
    for i in 0..count {
        let addr_u32 = network.wrapping_add(i as u32);
        let bytes = addr_u32.to_be_bytes();
        ips.push(Ipv4Addr::new(bytes[0], bytes[1], bytes[2], bytes[3]));
    }
    Ok(ips)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_cidr_24() {
        let ips = parse_cidr("192.168.1.0/24").unwrap();
        assert_eq!(ips.len(), 256);
        assert_eq!(ips[0], Ipv4Addr::new(192, 168, 1, 0));
        assert_eq!(ips[255], Ipv4Addr::new(192, 168, 1, 255));
    }

    #[test]
    fn test_parse_cidr_30() {
        let ips = parse_cidr("10.0.0.0/30").unwrap();
        assert_eq!(ips.len(), 4);
        assert_eq!(ips[0], Ipv4Addr::new(10, 0, 0, 0));
        assert_eq!(ips[3], Ipv4Addr::new(10, 0, 0, 3));
    }

    #[test]
    fn test_parse_cidr_32() {
        let ips = parse_cidr("172.16.0.1/32").unwrap();
        assert_eq!(ips.len(), 1);
        assert_eq!(ips[0], Ipv4Addr::new(172, 16, 0, 1));
    }

    #[test]
    fn test_parse_cidr_invalid() {
        assert!(parse_cidr("not-an-ip").is_err());
        assert!(parse_cidr("192.168.1.0/33").is_err());
        assert!(parse_cidr("192.168.1.0").is_err());
    }
}
